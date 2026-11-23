import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import {
    confirmAlert,
    errorAlert,
    toastAlert,
    warningAlert,
} from "../utils/alert";

function Todo() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [todos, setTodos] = useState([]);
    const [loadingTodos, setLoadingTodos] = useState(true);
    const [newText, setNewText] = useState("");
    const [filter, setFilter] = useState("all");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [editInvalid, setEditInvalid] = useState(false);

    // Animation states
    const [addedId, setAddedId] = useState(null);
    const [leavingIds, setLeavingIds] = useState([]);
    const [pillPulse, setPillPulse] = useState(false);
    const [listFiltering, setListFiltering] = useState(false);

    const newInputRef = useRef(null);
    const editInputRef = useRef(null);

    const prefersReducedMotion = () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const triggerPillPulse = () => {
        setPillPulse(false);
        requestAnimationFrame(() => setPillPulse(true));
    };

    // Load current user's todos from Supabase on mount
    useEffect(() => {
        let isMounted = true;

        const fetchTodos = async () => {
            setLoadingTodos(true);
            const { data: authData } = await supabase.auth.getUser();
            const activeUser = user || authData?.user;

            if (!activeUser) {
                if (isMounted) setLoadingTodos(false);
                return;
            }

            const { data, error } = await supabase
                .from("todos")
                .select("*")
                .eq("user_id", activeUser.id)
                .order("created_at", { ascending: true });

            if (!isMounted) return;

            if (error) {
                errorAlert("Failed to load todos", error.message, isDark);
            } else {
                setTodos(data || []);
            }
            setLoadingTodos(false);
        };

        fetchTodos();

        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        if (editingId !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const handleLogout = () => {
        confirmAlert(
            {
                icon: "question",
                title: "Log out?",
                text: "Your tasks are safely saved in Supabase for next time.",
                confirmText: "Yes, log out",
                cancelText: "Stay here",
                danger: false,
            },
            isDark,
        ).then(async (result) => {
            if (result.isConfirmed) {
                await supabase.auth.signOut();
                toastAlert("success", "Logged out. See you soon!", isDark);
                navigate("/login");
            }
        });
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        const trimmed = newText.trim();
        if (!trimmed) {
            newInputRef.current?.focus();
            warningAlert(
                "Nothing to add!",
                "Type a task first, then tap Add.",
                isDark,
            );
            return;
        }

        const currentUser = user || (await supabase.auth.getUser()).data?.user;
        if (!currentUser) {
            errorAlert(
                "Session expired",
                "Please log in again to save tasks.",
                isDark,
            );
            navigate("/login");
            return;
        }

        setNewText("");

        // Use 'status: "Pending"' instead of 'done'
        const { data, error } = await supabase
            .from("todos")
            .insert([
                { text: trimmed, user_id: currentUser.id, status: "Pending" },
            ])
            .select()
            .single();

        if (error) {
            errorAlert("Could not add task", error.message, isDark);
            setNewText(trimmed);
            return;
        }

        setTodos((prev) => [...prev, data]);
        setAddedId(data.id);

        if (filter === "done") {
            setFilter("all");
        }

        triggerPillPulse();
        toastAlert("success", "Task saved!", isDark);
        newInputRef.current?.focus();

        setTimeout(() => setAddedId(null), 400);
    };
    
    const handleToggleTodo = async (todo) => {
        const isCurrentlyCompleted = todo.status === "Completed";
        const nextStatus = isCurrentlyCompleted ? "Pending" : "Completed";

        const stillVisible =
            filter === "all" ||
            (filter === "active" && nextStatus === "Pending") ||
            (filter === "done" && nextStatus === "Completed");

        // Optimistic UI update
        if (!stillVisible && !prefersReducedMotion()) {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === todo.id ? { ...t, status: nextStatus } : t,
                ),
            );
            setTimeout(() => {
                setLeavingIds((prev) => [...prev, todo.id]);
                setTimeout(() => {
                    setLeavingIds((prev) =>
                        prev.filter((id) => id !== todo.id),
                    );
                }, 220);
            }, 180);
        } else {
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === todo.id ? { ...t, status: nextStatus } : t,
                ),
            );
            triggerPillPulse();
        }

        // Update the 'status' column in Supabase
        const { error } = await supabase
            .from("todos")
            .update({ status: nextStatus })
            .eq("id", todo.id);

        if (error) {
            // Revert UI state if the database update fails
            setTodos((prev) =>
                prev.map((t) =>
                    t.id === todo.id ? { ...t, status: todo.status } : t,
                ),
            );
            errorAlert("Update failed", error.message, isDark);
            return;
        }

        toastAlert(
            "success",
            nextStatus === "Completed"
                ? "Task completed. Well done!"
                : "Task marked as active again",
            isDark,
        );
    };

    const startEditing = (todo) => {
        setEditingId(todo.id);
        setEditText(todo.text);
        setEditInvalid(false);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditInvalid(false);
        toastAlert("info", "Edit cancelled", isDark);
    };

    const saveEditing = async (e, todo) => {
        e.preventDefault();
        const trimmed = editText.trim();
        if (!trimmed) {
            setEditInvalid(true);
            editInputRef.current?.focus();
            warningAlert(
                "Task can't be empty",
                "Type something for this task, or tap Cancel to keep the old text.",
                isDark,
            );
            return;
        }

        if (trimmed === todo.text) {
            setEditingId(null);
            toastAlert("info", "No changes made", isDark);
            return;
        }

        const { error } = await supabase
            .from("todos")
            .update({ text: trimmed })
            .eq("id", todo.id);

        if (error) {
            errorAlert("Could not update task", error.message, isDark);
            return;
        }

        setTodos((prev) =>
            prev.map((t) => (t.id === todo.id ? { ...t, text: trimmed } : t)),
        );
        setEditingId(null);
        toastAlert("success", "Task updated successfully!", isDark);
    };

    const handleDelete = (todo) => {
        confirmAlert(
            {
                icon: "warning",
                title: "Delete this task?",
                text: `“${todo.text}” will be permanently deleted. This can't be undone.`,
                confirmText: "Yes, delete it",
                cancelText: "Keep it",
                danger: true,
            },
            isDark,
        ).then(async (result) => {
            if (!result.isConfirmed) return;
            if (editingId === todo.id) setEditingId(null);

            const { error } = await supabase
                .from("todos")
                .delete()
                .eq("id", todo.id);

            if (error) {
                errorAlert("Could not delete task", error.message, isDark);
                return;
            }

            const doDelete = () => {
                setTodos((prev) => prev.filter((t) => t.id !== todo.id));
                setLeavingIds((prev) => prev.filter((id) => id !== todo.id));
                toastAlert("success", "Task deleted", isDark);
            };

            if (prefersReducedMotion()) {
                doDelete();
                return;
            }

            setLeavingIds((prev) => [...prev, todo.id]);
            setTimeout(doDelete, 240);
        });
    };

    const handleFilterChange = (nextFilter) => {
        if (filter === nextFilter) return;
        setEditingId(null);
        setFilter(nextFilter);
        setListFiltering(true);
        setTimeout(() => setListFiltering(false), 320);
    };

    const handleClearCompleted = () => {
        const doneTodos = todos.filter((t) => t.done);
        if (doneTodos.length === 0) {
            warningAlert(
                "Nothing to clear",
                "You have no completed tasks yet. Tick one off first!",
                isDark,
            );
            return;
        }

        confirmAlert(
            {
                icon: "warning",
                title: "Clear completed tasks?",
                text: `${doneTodos.length} ${
                    doneTodos.length === 1
                        ? "completed task"
                        : "completed tasks"
                } will be removed. This can't be undone.`,
                confirmText: "Yes, clear them",
                cancelText: "Keep them",
                danger: true,
            },
            isDark,
        ).then(async (result) => {
            if (!result.isConfirmed) return;
            setEditingId(null);

            const doneIds = doneTodos.map((t) => t.id);
            const { error } = await supabase
                .from("todos")
                .delete()
                .in("id", doneIds);

            if (error) {
                errorAlert("Could not clear tasks", error.message, isDark);
                return;
            }

            const doClear = () => {
                setTodos((prev) => prev.filter((t) => !t.done));
                setLeavingIds([]);
                toastAlert("success", "Completed tasks cleared!", isDark);
            };

            if (prefersReducedMotion()) {
                doClear();
                return;
            }

            setLeavingIds((prev) => [...prev, ...doneIds]);
            setTimeout(doClear, 240);
        });
    };

    const visibleTodos = todos.filter((t) => {
        if (filter === "active") return !t.done;
        if (filter === "done") return t.done;
        return true;
    });

    const leftCount = todos.filter((t) => !t.done).length;
    const hasCompleted = todos.some((t) => t.done);
    const displayName = user?.user_metadata?.full_name || user?.email;

    return (
        <div className="card wide">
            <div className="todo-head">
                <div>
                    <h1>
                        {displayName ? `${displayName}'s Todos` : "My Todos"}
                    </h1>
                    <p className="sub" style={{ margin: 0 }}>
                        Add tasks, edit them, tick them off, stay on track.
                    </p>
                </div>
                <div className="head-side">
                    <span className={`count-pill ${pillPulse ? "pulse" : ""}`}>
                        {leftCount} left
                    </span>
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                </div>
            </div>

            <form className="add-row" onSubmit={handleAddTodo}>
                <input
                    ref={newInputRef}
                    type="text"
                    placeholder="What needs to be done?"
                    aria-label="New todo"
                    maxLength={120}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                />
                <button type="submit" className="btn">
                    Add
                </button>
            </form>

            <div className="filters" role="group" aria-label="Filter todos">
                {["all", "active", "done"].map((f) => (
                    <button
                        key={f}
                        type="button"
                        className={filter === f ? "active" : ""}
                        onClick={() => handleFilterChange(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loadingTodos ? (
                <p className="empty">Loading your tasks...</p>
            ) : (
                <>
                    <ul
                        className={`todo-list ${listFiltering ? "filtering" : ""}`}
                    >
                        {visibleTodos.map((t) => {
                            const isEditing = editingId === t.id;
                            const isLeaving = leavingIds.includes(t.id);
                            const isEntering = addedId === t.id;

                            return (
                                <li
                                    key={t.id}
                                    className={`todo-item ${t.done ? "done" : ""} ${
                                        isEditing ? "editing" : ""
                                    } ${isEntering ? "entering" : ""} ${
                                        isLeaving ? "leaving" : ""
                                    }`}
                                >
                                    {isEditing ? (
                                        <form
                                            className="edit-form"
                                            aria-label="Edit task"
                                            onSubmit={(e) => saveEditing(e, t)}
                                        >
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                className="edit-input"
                                                value={editText}
                                                maxLength={120}
                                                aria-label="Edit task text"
                                                style={
                                                    editInvalid
                                                        ? {
                                                              borderColor:
                                                                  "var(--danger)",
                                                          }
                                                        : undefined
                                                }
                                                onChange={(e) => {
                                                    setEditText(e.target.value);
                                                    setEditInvalid(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") {
                                                        e.preventDefault();
                                                        setEditingId(null);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                className="edit-save"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                className="edit-cancel"
                                                onClick={cancelEditing}
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    ) : (
                                        <>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={t.done}
                                                    aria-label={`Mark done: ${t.text}`}
                                                    onChange={() =>
                                                        handleToggleTodo(t)
                                                    }
                                                />
                                                <span
                                                    className="todo-text"
                                                    title="Double-click to edit"
                                                    onDoubleClick={(e) => {
                                                        e.preventDefault();
                                                        startEditing(t);
                                                    }}
                                                >
                                                    {t.text}
                                                </span>
                                            </label>

                                            <span className="todo-actions">
                                                <button
                                                    type="button"
                                                    className="edit-btn"
                                                    aria-label={`Edit: ${t.text}`}
                                                    disabled={isLeaving}
                                                    onClick={() =>
                                                        startEditing(t)
                                                    }
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                        <path d="m15 5 4 4" />
                                                    </svg>
                                                    <span className="edit-label">
                                                        Edit
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="del-btn"
                                                    aria-label={`Delete: ${t.text}`}
                                                    disabled={isLeaving}
                                                    onClick={() =>
                                                        handleDelete(t)
                                                    }
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        <line
                                                            x1="10"
                                                            x2="10"
                                                            y1="11"
                                                            y2="17"
                                                        />
                                                        <line
                                                            x1="14"
                                                            x2="14"
                                                            y1="11"
                                                            y2="17"
                                                        />
                                                    </svg>
                                                    <span className="del-label">
                                                        Delete
                                                    </span>
                                                </button>
                                            </span>
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {visibleTodos.length === 0 && (
                        <p className="empty">
                            {todos.length === 0
                                ? "No todos here yet. Add your first one above."
                                : filter === "done"
                                  ? "Nothing completed yet — tick a task off first."
                                  : "All caught up. Nothing active right now."}
                        </p>
                    )}
                </>
            )}

            <div className="todo-foot">
                <span>
                    {todos.length}{" "}
                    {todos.length === 1 ? "task total" : "tasks total"}
                </span>
                <button
                    type="button"
                    className="clear-btn"
                    disabled={!hasCompleted}
                    onClick={handleClearCompleted}
                >
                    Clear completed
                </button>
            </div>
        </div>
    );
}

export default Todo;
