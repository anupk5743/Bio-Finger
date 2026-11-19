import React, { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { batchService } from '../../services/batch.service';
import { Batch } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { SlideOver } from '../../components/common/SlideOver';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

const batchSchema = z.object({
  name: z.string().min(1, 'Batch Name is required').max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type BatchFormData = z.infer<typeof batchSchema>;

export const BatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Modals & Drawers state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: '',
      status: 'ACTIVE',
    },
  });

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const res = await batchService.getBatches({
        page: currentPage,
        limit: 10,
        search,
      });
      setBatches(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalResults(res.meta.total);
    } catch (err: any) {
      toast.error('Failed to fetch batches from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [currentPage, search]);

  const handleOpenAdd = () => {
    reset({ name: '', status: 'ACTIVE' });
    setEditingBatch(null);
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setValue('name', batch.name);
    setValue('status', batch.status);
    setIsAddDrawerOpen(true);
    setActiveMenuId(null);
  };

  const handleFormSubmit = async (data: BatchFormData) => {
    try {
      if (editingBatch) {
        await batchService.updateBatch(editingBatch.id, data);
        toast.success(`Batch '${data.name}' updated successfully!`);
      } else {
        await batchService.createBatch(data);
        toast.success(`Batch '${data.name}' created successfully!`);
      }
      setIsAddDrawerOpen(false);
      loadBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBatch) return;
    try {
      await batchService.deleteBatch(deletingBatch.id);
      toast.success(`Batch '${deletingBatch.name}' deleted successfully!`);
      setDeletingBatch(null);
      loadBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete batch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Card Container matching Screenshot 5 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Top Header matching Screenshot 5 */}
        <div className="p-6 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Batch List</h2>

          <div className="flex items-center space-x-3.5 w-full sm:w-auto">
            {/* Search Batch input matching Screenshot 5 */}
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Batch"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* + ADD Button matching Screenshot 5 */}
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover flex items-center space-x-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>ADD</span>
            </button>
          </div>
        </div>

        {/* Table matching Screenshot 5 */}
        {isLoading ? (
          <TableLoadingSkeleton rows={5} cols={4} />
        ) : batches.length === 0 ? (
          <EmptyState
            title="No batches found"
            description="Create your first student batch to start enrolling."
            actionText="+ ADD BATCH"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs bg-slate-50/50">
                  <th className="py-4 px-6 font-bold w-20">S.NO</th>
                  <th className="py-4 px-6 font-bold">BATCH NAME</th>
                  <th className="py-4 px-6 font-bold">STATUS</th>
                  <th className="py-4 px-6 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch, idx) => (
                  <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* S.NO */}
                    <td className="py-4 px-6 text-slate-500 font-semibold text-sm">
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>

                    {/* BATCH NAME */}
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm tracking-wider">
                      {batch.name}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      <StatusBadge status={batch.status} />
                    </td>

                    {/* ACTION Menu matching Screenshot 5 */}
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === batch.id ? null : batch.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>

                      {activeMenuId === batch.id && (
                        <div className="absolute right-6 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-left animate-fadeIn">
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                            <span>Edit Batch</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeletingBatch(batch);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-slate-100"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination matching Screenshot 5 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={10}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* SlideOver Batch Create/Edit Form matching Screenshot 6 */}
      <SlideOver
        isOpen={isAddDrawerOpen}
        title={editingBatch ? 'Batch Edit Form' : 'Batch Create Form'}
        onClose={() => setIsAddDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Batch Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Batch Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Enter Your Batch Name"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary placeholder-slate-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
          </div>

          {/* Action Buttons matching Screenshot 6: RESET (Red/Orange) and SUBMIT (Purple) */}
          <div className="pt-8 flex items-center justify-end space-x-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => reset({ name: '', status: 'ACTIVE' })}
              className="px-7 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#f4516c] hover:bg-[#e03d58] transition-colors shadow-sm"
            >
              RESET
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingBatch}
        title="Confirm Batch Deletion"
        message={`Are you sure you want to delete batch '${deletingBatch?.name}'?`}
        confirmLabel="DELETE"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBatch(null)}
      />
    </div>
  );
};
