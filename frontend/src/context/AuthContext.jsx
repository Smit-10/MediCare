import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  authMe,
  authLogin,
  logout as apiLogout,
  api,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the currently authenticated user
  const refreshUser = async () => {
    let result;

    try {
      result = await authMe();
    } catch {
      setUser(null);
      return null;
    }

    const normalizedUser = {
      ...result.user,
      role: String(result.user?.role || "patient").toLowerCase(),
      profileCompleted: true,
    };

    // Check whether the patient has completed their profile
    if (normalizedUser.role === "patient") {
      try {
        await api("/patients/profile");
        normalizedUser.profileCompleted = true;
      } catch (error) {
        if (error.status === 404) {
          normalizedUser.profileCompleted = false;
        } else {
          console.error(
            "Could not check patient profile:",
            error
          );
        }
      }
    }

    setUser(normalizedUser);
    return normalizedUser;
  };

  // Check the session when the application loads
  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Login using email and password
  const login = async (email, password) => {
    await authLogin(email, password);

    const currentUser = await refreshUser();

    if (!currentUser) {
      throw new Error(
        "Login succeeded, but the user session could not be loaded."
      );
    }

    return currentUser;
  };

  // Register a patient using email and password
  const registerPatient = async ({
    name,
    email,
    password,
    phone,
    dob,
    gender,
    address,
  }) => {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    await login(email, password);

    try {
      await api("/patients/profile", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          dob,
          gender,
          address,
        }),
      });
    } catch (error) {
      if (
        !String(error.message)
          .toLowerCase()
          .includes("already exists")
      ) {
        throw error;
      }
    }

    return await refreshUser();
  };

  // Logout the current user
  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        registerPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
