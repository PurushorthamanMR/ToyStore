import Swal from 'sweetalert2';

function themed() {
  const isDark = document.documentElement.classList.contains('dark');
  return Swal.mixin({
    background: isDark ? '#171717' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#111827',
    confirmButtonColor: '#25D366',
    cancelButtonColor: isDark ? '#404040' : '#e5e7eb',
    customClass: {
      cancelButton: isDark ? '' : '!text-gray-700',
    },
    buttonsStyling: true,
    reverseButtons: true,
  });
}

export async function confirmAction({
  title = 'Are you sure?',
  text,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  icon = 'warning',
} = {}) {
  const result = await themed().fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export function successAlert(title, text) {
  return themed().fire({
    title,
    text,
    icon: 'success',
    timer: 1800,
    showConfirmButton: false,
  });
}

export function errorAlert(title, text) {
  return themed().fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
  });
}

export function infoAlert(title, html) {
  return themed().fire({
    title,
    html,
    icon: 'info',
    confirmButtonText: 'Got it',
  });
}
