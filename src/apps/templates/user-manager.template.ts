import { UITree } from '../types.js';

export function buildUserManagerTree(data: {
  users: any[];
}): UITree {
  const users = data.users || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 'active' || !u.deleted).length;
  const adminUsers = users.filter((u: any) => u.role === 'admin' || u.type === 'admin').length;
  const roles = [...new Set(users.map((u: any) => u.role || u.type || 'user'))];
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const userRows = users.slice(0, 10).map((u: any) => ({
    id: u.id || '',
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Unknown',
    email: u.email || '—',
    phone: u.phone || '—',
    role: u.role || u.type || 'user',
    status: u.deleted ? 'inactive' : 'active',
    lastActive: fmtDate(u.lastActiveAt || u.updatedAt),
  }));

  const roleSegments = roles.map((role, i) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: users.filter((u: any) => (u.role || u.type || 'user') === role).length,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
  }));

  const avatars = users.slice(0, 8).map((u: any) => ({
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User',
    initials: `${(u.firstName || 'U')[0]}${(u.lastName || '')[0] || ''}`.toUpperCase(),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'User Manager',
          subtitle: `${totalUsers} users · ${roles.length} roles · ${adminUsers} admins`,
          gradient: true,
          stats: [
            { label: 'Total Users', value: String(totalUsers) },
            { label: 'Active', value: String(activeUsers) },
            { label: 'Admins', value: String(adminUsers) },
            { label: 'Roles', value: String(roles.length) },
          ],
        },
        children: ['userActions', 'userSearch', 'metrics', 'teamAvatars', 'layout'],
      },
      userActions: {
        key: 'userActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['userCreateBtn', 'userUpdateBtn'],
      },
      userCreateBtn: {
        key: 'userCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create User', variant: 'primary', toolName: 'create_user', toolArgs: {} },
      },
      userUpdateBtn: {
        key: 'userUpdateBtn',
        type: 'ActionButton',
        props: { label: 'Update User', variant: 'secondary', toolName: 'update_user', toolArgs: {} },
      },
      userSearch: {
        key: 'userSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search users...', searchTool: 'search_users' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mActive', 'mAdmins', 'mRoles'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Users', value: String(totalUsers), color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeUsers), color: 'green', trend: activeUsers > 0 ? 'up' : 'flat' } },
      mAdmins: { key: 'mAdmins', type: 'MetricCard', props: { label: 'Admins', value: String(adminUsers), color: 'purple' } },
      mRoles: { key: 'mRoles', type: 'MetricCard', props: { label: 'Roles', value: String(roles.length), color: 'yellow' } },
      teamAvatars: {
        key: 'teamAvatars',
        type: 'AvatarGroup',
        props: { avatars, max: 8, size: 'md' },
      },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['userTableCard', 'sidePanel'],
      },
      userTableCard: {
        key: 'userTableCard',
        type: 'Card',
        props: { title: `Users (${totalUsers})`, padding: 'none' },
        children: ['userTable'],
      },
      userTable: {
        key: 'userTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Name', format: 'avatar', sortable: true },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'role', label: 'Role', format: 'status' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'lastActive', label: 'Last Active', format: 'date', sortable: true },
          ],
          rows: userRows,
          emptyMessage: 'No users found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'User Analytics' },
        children: ['activeProgress', 'roleChart', 'userKV'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Active Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 80 ? 'green' : activeRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      roleChart: {
        key: 'roleChart',
        type: 'PieChart',
        props: {
          segments: roleSegments.length > 0 ? roleSegments : [{ label: 'No users', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Users by Role',
          showLegend: true,
        },
      },
      userKV: {
        key: 'userKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Users', value: String(totalUsers), bold: true },
            { label: 'Active', value: String(activeUsers), variant: 'success' as const },
            { label: 'Inactive', value: String(Math.max(0, totalUsers - activeUsers)), variant: totalUsers - activeUsers > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Admins', value: String(adminUsers) },
            { label: 'Roles', value: roles.join(', ') || '—' },
          ],
          compact: true,
        },
      },
    },
  };
}
