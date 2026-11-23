import Swal from "sweetalert2";

function getSwalTheme(isDark) {
    return {
        background: isDark ? "#1a211f" : "#ffffff",
        color: isDark ? "#eef4f2" : "#16211f",
        confirmButtonColor: isDark ? "#2fbd9f" : "#0f7b6c",
        cancelButtonColor: isDark ? "#232c2a" : "#eef1f4",
    };
}

export function toastAlert(icon, title, isDark) {
    const t = getSwalTheme(isDark);
    Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2400,
        timerProgressBar: true,
        background: t.background,
        color: t.color,
    });
}

export function successAlert(title, text, timer, isDark) {
    const t = getSwalTheme(isDark);
    return Swal.fire({
        icon: "success",
        title,
        text: text || undefined,
        timer: timer || undefined,
        timerProgressBar: !!timer,
        showConfirmButton: !timer,
        confirmButtonText: "Great!",
        confirmButtonColor: t.confirmButtonColor,
        background: t.background,
        color: t.color,
        backdrop: isDark ? "rgba(0,0,0,0.65)" : "rgba(16,42,38,0.35)",
    });
}

export function errorAlert(title, text, isDark) {
    const t = getSwalTheme(isDark);
    return Swal.fire({
        icon: "error",
        title,
        text: text || undefined,
        confirmButtonText: "Try again",
        confirmButtonColor: "#c2410c",
        background: t.background,
        color: t.color,
    });
}

export function warningAlert(title, text, isDark) {
    const t = getSwalTheme(isDark);
    return Swal.fire({
        icon: "warning",
        title,
        text: text || undefined,
        confirmButtonText: "OK",
        confirmButtonColor: t.confirmButtonColor,
        background: t.background,
        color: t.color,
    });
}

export function infoAlert(title, text, isDark) {
    const t = getSwalTheme(isDark);
    return Swal.fire({
        icon: "info",
        title,
        text: text || undefined,
        confirmButtonText: "Got it",
        confirmButtonColor: t.confirmButtonColor,
        background: t.background,
        color: t.color,
    });
}

export function confirmAlert(opts, isDark) {
    const t = getSwalTheme(isDark);
    return Swal.fire({
        icon: opts.icon || "warning",
        title: opts.title,
        text: opts.text || undefined,
        showCancelButton: true,
        confirmButtonText: opts.confirmText || "Yes, continue",
        cancelButtonText: opts.cancelText || "Cancel",
        confirmButtonColor: opts.danger ? "#c2410c" : t.confirmButtonColor,
        cancelButtonColor: t.cancelButtonColor,
        reverseButtons: true,
        focusCancel: true,
        background: t.background,
        color: t.color,
        backdrop: isDark ? "rgba(0,0,0,0.65)" : "rgba(16,42,38,0.35)",
    });
}
