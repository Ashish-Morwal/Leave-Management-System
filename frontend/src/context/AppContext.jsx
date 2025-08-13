import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
} from "react";
import { login as loginApi, getEmployees, createEmployee } from "../api";

export const ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  LOGOUT: "LOGOUT",
  SET_ROLE: "SET_ROLE",
  SET_EMPLOYEES: "SET_EMPLOYEES",
  SET_LEAVES: "SET_LEAVES",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
};

const initialState = {
  user: JSON.parse(localStorage.getItem("lm_user") || "null"),
  token: localStorage.getItem("lm_token") || null,
  role: localStorage.getItem("lm_role") || "Admin", // default for demo
  employees: [],
  leaves: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOGIN_SUCCESS:
    case ACTIONS.REGISTER_SUCCESS: {
      const { user, token } = action.payload;
      localStorage.setItem("lm_user", JSON.stringify(user));
      localStorage.setItem("lm_token", token);
      localStorage.setItem("lm_role", user?.role || state.role);
      return {
        ...state,
        user,
        token,
        role: user?.role || state.role,
        loading: false,
        error: null,
      };
    }
    case ACTIONS.LOGOUT: {
      localStorage.removeItem("lm_user");
      localStorage.removeItem("lm_token");
      localStorage.removeItem("lm_role");
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        employees: [],
        leaves: [],
      };
    }
    case ACTIONS.SET_ROLE:
      localStorage.setItem("lm_role", action.payload);
      return { ...state, role: action.payload };
    case ACTIONS.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload,
        loading: false,
        error: null,
      };
    case ACTIONS.SET_LEAVES:
      return { ...state, leaves: action.payload, loading: false, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

const AppContext = createContext({ state: initialState, dispatch: () => {} });

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await loginApi(credentials);
      const { token, user } = response.data;
      dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: { token, user } });
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await getEmployees();
      const employees = response.data?.employees || [];
      dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: employees });
      return { success: true, employees };
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to load employees";
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, []);

  const addEmployee = useCallback(
    async (employeeData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        await createEmployee(employeeData);
        // Reload employees after adding
        await loadEmployees();
        return { success: true };
      } catch (error) {
        const message =
          error?.response?.data?.message || "Failed to add employee";
        dispatch({ type: ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }
    },
    [loadEmployees]
  );

  const logout = useCallback(() => {
    dispatch({ type: ACTIONS.LOGOUT });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      // Refresh both employees and leaves data
      await loadEmployees();
      // Note: loadLeaves would be implemented here if needed
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [loadEmployees]);

  const value = useMemo(
    () => ({
      state,
      login,
      loadEmployees,
      addEmployee,
      logout,
      refreshData,
    }),
    [state, login, loadEmployees, addEmployee, logout, refreshData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
