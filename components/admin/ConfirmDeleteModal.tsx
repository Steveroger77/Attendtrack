import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User } from '../../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  loading: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, user, loading }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="p-6">
        <p className="text-gray-300">
          Are you sure you want to delete the user{' '}
          <strong className="font-semibold text-white">{user.name}</strong> ({user.college_id})?
        </p>
        <p className="mt-2 text-sm text-yellow-400">
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
