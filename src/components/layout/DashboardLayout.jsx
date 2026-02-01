import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
    const { user } = useAuth();

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-layout__main">
                <Header userName={user?.name || 'User'} />
                <div className="dashboard-layout__content">
                    {children}
                </div>
            </main>
        </div>
    );
}
