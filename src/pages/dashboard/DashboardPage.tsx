import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  UserCheck,
  Users as UsersIcon,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { dashboardService } from '../../services/dashboard.service';
import { DashboardSummary } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sumRes = await dashboardService.getSummary();
      setSummary(sumRes);
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards matching Screenshot 2 (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Batches"
          value={summary?.totalBatches ?? 0}
          subBadgeText={`${summary?.totalBatches ?? 0} Total Batches Count`}
          subBadgeType="green"
          icon={Layers}
          iconBgColor="bg-[#5b52f9]"
          onClick={() => navigate('/batches')}
        />

        <StatCard
          title="Batches Created By Users"
          value={summary?.batchesCreatedByUsers ?? 0}
          subBadgeText={`↑ 0 Pending Batches (User)`}
          subBadgeType="green"
          icon={UsersIcon}
          iconBgColor="bg-[#00c5dc]"
          onClick={() => navigate('/batches')}
        />

        <StatCard
          title="Remaing Batches"
          value={summary?.remainingBatches ?? 0}
          subBadgeText={`↓ 0 Total Remaing Batch`}
          subBadgeType="green"
          icon={UserCheck}
          iconBgColor="bg-[#f4516c]"
          onClick={() => navigate('/batches')}
        />

        <StatCard
          title="Students"
          value={summary?.totalStudents ?? 0}
          subBadgeText={`+ ${summary?.totalStudents ?? 0} Total Students`}
          subBadgeType="pink"
          icon={GraduationCap}
          iconBgColor="bg-[#ffb822]"
          onClick={() => navigate('/students')}
        />
      </div>
    </div>
  );
};
