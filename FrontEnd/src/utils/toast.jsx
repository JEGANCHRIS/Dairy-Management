import { toast } from 'react-toastify';

// Success toast
export const success = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};

// Error toast
export const error = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};

// Warning toast
export const warning = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};

// Info toast
export const info = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};

// Confirmation dialog using toast
export const confirm = (message, onConfirm, onCancel) => {
  toast.warning(
    ({ closeToast }) => (
      <div>
        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              closeToast();
              if (onCancel) onCancel();
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '5px',
              background: '#e0e0e0',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              closeToast();
              if (onConfirm) onConfirm();
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '5px',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    {
      position: "top-center",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      theme: "colored",
    }
  );
};
