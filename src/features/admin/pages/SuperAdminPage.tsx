import React from 'react';
import { useMachines, useOperators, useUsers } from '../api';
import { useParts, useModels } from '../../engineering/api';
import { SuperAdminView } from '../../../components/RoleViews/SuperAdminView';
import { api } from '../../../api/client';

export function SuperAdminPage() {
  const { data: machines = [] } = useMachines();
  const { data: operators = [] } = useOperators();
  const { data: users = [] } = useUsers();
  const { data: parts = [] } = useParts();
  const { data: models = [] } = useModels();

  const handleExportDatabase = async () => {
    window.open(api.backup.exportUrl, '_blank');
  };

  const handleImportDatabase = async () => {
    window.location.reload();
  };

  const handleResetFactoryData = async () => {
    await api.backup.reset();
    window.location.reload();
  };

  return (
    <SuperAdminView
      models={models}
      machines={machines}
      parts={parts}
      foundries={[]}
      operators={operators}
      users={users}
      onAddModel={() => {}}
      onAddMachine={() => {}}
      onAddPart={() => {}}
      onAddFoundry={() => {}}
      onAddOperator={() => {}}
      onAddUser={() => {}}
      onExportDatabase={handleExportDatabase}
      onImportDatabase={handleImportDatabase}
      onResetFactoryData={handleResetFactoryData}
    />
  );
}
