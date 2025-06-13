import React, { useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { usePageContext } from '../contexts/PageContext';
import { BellIcon } from '../constants';

const NotificationsPage: React.FC = () => {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext('/notifications', 'All Notifications');
  }, [setPageContext]);

  // Mock notifications
  const mockNotifications = [
    { id: 1, title: "Model Training Complete", message: "Model 'Prod_Gamma_V2' finished training successfully.", timestamp: new Date(Date.now() - 1000 * 60 * 30), read: false, type: 'success' },
    { id: 2, title: "Critical System Alert", message: "CPU usage exceeded 90% on worker-03.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false, type: 'error' },
    { id: 3, title: "New Dataset Processed", message: "Dataset 'Internal_Capture_Aug_2024' is now ready for use.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true, type: 'info' },
    { id: 4, title: "Federated Round Started", message: "Federated Learning Round 139 has commenced.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true, type: 'info' },
  ];

  const getIconForType = (type: string) => {
    if (type === 'success') return <BellIcon className="w-5 h-5 text-success"/>;
    if (type === 'error') return <BellIcon className="w-5 h-5 text-danger"/>;
    return <BellIcon className="w-5 h-5 text-accent-blue"/>; // Default for info
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader 
        title="All Notifications" 
        subtitle="Review your system alerts and important updates." 
      />

      <Card>
        {mockNotifications.length > 0 ? (
          <ul className="divide-y divide-tertiary-dark">
            {mockNotifications.map(notification => (
              <li 
                key={notification.id} 
                className={`p-4 hover:bg-tertiary-dark/50 ${!notification.read ? 'bg-tertiary-dark/30' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="mt-0.5">{getIconForType(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-sm font-semibold ${!notification.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {notification.timestamp.toLocaleTimeString()} - {notification.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-text-secondary' : 'text-text-secondary/70'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="w-2.5 h-2.5 bg-accent-blue rounded-full mt-1.5" title="Unread"></span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-text-secondary">
            <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
            You have no notifications at this time.
          </div>
        )}
      </Card>
      <div className="text-center mt-4">
        <button className="btn-secondary text-sm">Load More (Placeholder)</button>
      </div>
    </div>
  );
};

export default NotificationsPage;