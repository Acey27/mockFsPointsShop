import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  HomeIcon,
  ChartBarIcon,
  GiftIcon,
  FaceSmileIcon,
  UserIcon,
  CogIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

/**
 * Navigation item type
 * @typedef {Object} NavigationItem
 * @param {string} name - Display name
 * @param {string} href - Route path
 * @param {React.Component} icon - Icon component
 * @param {boolean} [adminOnly] - Whether item is admin-only
 */

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Points', href: '/points', icon: ChartBarIcon },
  { name: 'Shop', href: '/shop', icon: GiftIcon },
  { name: 'Order History', href: '/orders', icon: DocumentTextIcon },
  { name: 'Mood', href: '/mood', icon: FaceSmileIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Admin', href: '/admin', icon: CogIcon, adminOnly: true },
  { name: 'Purchase Logs', href: '/admin/purchase-logs', icon: ClipboardDocumentListIcon, adminOnly: true },
];

const Sidebar= () => {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)]">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
