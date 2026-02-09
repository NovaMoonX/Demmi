import { Outlet } from 'react-router-dom';
import { Sidebar } from '@components/Sidebar';

function Layout() {
  return (
    <div className="page transition-colors duration-200 flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
