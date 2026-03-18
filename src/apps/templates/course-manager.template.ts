import { UITree } from '../types.js';

export function buildCourseManagerTree(data: {
  courses: any[];
}): UITree {
  const courses = data.courses || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalCourses = courses.length;
  const published = courses.filter((c: any) => c.status === 'published' || c.published).length;
  const draft = totalCourses - published;
  const totalStudents = courses.reduce((s: number, c: any) => s + (c.enrollmentCount || c.studentCount || 0), 0);
  const publishRate = totalCourses > 0 ? Math.round((published / totalCourses) * 100) : 0;

  // Student enrollment bar chart
  const enrollBars = courses.slice(0, 8).map((c: any) => ({
    label: (c.title || c.name || 'Course').slice(0, 15),
    value: c.enrollmentCount || c.studentCount || 0,
    color: (c.status === 'published' || c.published) ? '#10b981' : '#94a3b8',
  })).filter((b: any) => b.value > 0);

  const courseRows = courses.slice(0, 8).map((c: any) => ({
    id: c.id || '',
    name: c.title || c.name || 'Untitled',
    students: c.enrollmentCount || c.studentCount || 0,
    lessons: c.lessonCount || (c.lessons || []).length || 0,
    status: c.status || (c.published ? 'published' : 'draft'),
    completion: typeof c.completionRate === 'number' ? `${c.completionRate}%` : '—',
    created: fmtDate(c.createdAt || c.dateAdded),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Course Manager',
          subtitle: `${totalCourses} courses · ${totalStudents} total students`,
          gradient: true,
          stats: [
            { label: 'Courses', value: String(totalCourses) },
            { label: 'Published', value: String(published) },
            { label: 'Draft', value: String(draft) },
            { label: 'Students', value: String(totalStudents) },
          ],
        },
        children: ['courseActions', 'courseSearch', 'metrics', 'layout'],
      },
      courseActions: {
        key: 'courseActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['courseCreateBtn', 'courseCreateCatBtn'],
      },
      courseCreateBtn: {
        key: 'courseCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create Course', variant: 'primary', toolName: 'create_course', toolArgs: {} },
      },
      courseCreateCatBtn: {
        key: 'courseCreateCatBtn',
        type: 'ActionButton',
        props: { label: 'Create Category', variant: 'secondary', toolName: 'create_course_category', toolArgs: {} },
      },
      courseSearch: {
        key: 'courseSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search courses...', searchTool: 'get_courses' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mCourses', 'mPublished', 'mDraft', 'mStudents'],
      },
      mCourses: { key: 'mCourses', type: 'MetricCard', props: { label: 'Total Courses', value: String(totalCourses), color: 'blue' } },
      mPublished: { key: 'mPublished', type: 'MetricCard', props: { label: 'Published', value: String(published), color: 'green', trend: published > 0 ? 'up' : 'flat' } },
      mDraft: { key: 'mDraft', type: 'MetricCard', props: { label: 'Draft', value: String(draft), color: 'yellow' } },
      mStudents: { key: 'mStudents', type: 'MetricCard', props: { label: 'Enrolled Students', value: String(totalStudents), color: 'purple' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['courseTableCard', 'sidePanel'],
      },
      courseTableCard: {
        key: 'courseTableCard',
        type: 'Card',
        props: { title: `Courses (${totalCourses})`, padding: 'none' },
        children: ['courseTable'],
      },
      courseTable: {
        key: 'courseTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Course', format: 'text', sortable: true },
            { key: 'students', label: 'Students', format: 'text', sortable: true },
            { key: 'lessons', label: 'Lessons', format: 'text' },
            { key: 'completion', label: 'Completion', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'created', label: 'Created', format: 'date' },
          ],
          rows: courseRows,
          emptyMessage: 'No courses found',
          pageSize: 8,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Course Insights' },
        children: ['publishProgress', 'enrollChart', 'courseKV'],
      },
      publishProgress: {
        key: 'publishProgress',
        type: 'ProgressBar',
        props: {
          label: 'Publish Rate',
          value: publishRate,
          max: 100,
          color: publishRate >= 70 ? 'green' : publishRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      enrollChart: {
        key: 'enrollChart',
        type: 'BarChart',
        props: {
          bars: enrollBars.length > 0 ? enrollBars : [{ label: 'No enrollments', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Enrollment by Course',
        },
      },
      courseKV: {
        key: 'courseKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Courses', value: String(totalCourses), bold: true },
            { label: 'Published', value: String(published), variant: 'success' as const },
            { label: 'Draft', value: String(draft), variant: 'muted' as const },
            { label: 'Total Students', value: String(totalStudents) },
            { label: 'Avg Students/Course', value: totalCourses > 0 ? String(Math.round(totalStudents / totalCourses)) : '0' },
          ],
          compact: true,
        },
      },
    },
  };
}
