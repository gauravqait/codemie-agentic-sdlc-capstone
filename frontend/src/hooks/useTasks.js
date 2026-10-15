import { useEffect, useMemo, useReducer } from 'react';
import { createTask, normalizeTask, validateTaskInput } from '../utils/taskModel.js';
import { loadTasks, saveTasks } from '../services/storage.js';

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': {
      return { ...state, tasks: action.tasks };
    }
    case 'ADD': {
      return { ...state, tasks: [action.task, ...state.tasks] };
    }
    case 'UPDATE': {
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    }
    case 'DELETE': {
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    }
    default:
      return state;
  }
}

export function useTasks() {
  const [state, dispatch] = useReducer(reducer, { tasks: [] });

  useEffect(() => {
    const tasks = loadTasks();
    dispatch({ type: 'LOAD', tasks });
  }, []);

  useEffect(() => {
    saveTasks(state.tasks);
  }, [state.tasks]);

  const api = useMemo(() => {
    return {
      tasks: state.tasks,
      addTask(input) {
        const result = validateTaskInput(input);
        if (!result.ok) return { ok: false, errors: result.errors };

        const task = createTask({
          title: result.value.title,
          description: result.value.description,
          status: result.value.status,
        });
        dispatch({ type: 'ADD', task });
        return { ok: true, task };
      },
      updateTask(id, input) {
        const existing = state.tasks.find((t) => t.id === id);
        if (!existing) return { ok: false, errors: { form: 'Task not found.' } };

        const result = validateTaskInput(input);
        if (!result.ok) return { ok: false, errors: result.errors };

        const patch = {
          title: result.value.title,
          description: result.value.description,
          status: result.value.status,
          updatedAt: result.value.updatedAt,
        };
        const normalized = normalizeTask({ ...existing, ...patch });
        if (!normalized) return { ok: false, errors: { form: 'Invalid task data.' } };

        dispatch({ type: 'UPDATE', id, patch });
        return { ok: true };
      },
      deleteTask(id) {
        dispatch({ type: 'DELETE', id });
      },
      setTasks(tasks) {
        dispatch({ type: 'LOAD', tasks });
      },
    };
  }, [state.tasks]);

  return api;
}
