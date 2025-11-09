'use client'
import React, { useEffect } from 'react'
import useSidebar from '../../../hooks/useSidebar';
import { usePathname } from 'next/navigation';
import useAdmin from '../../../hooks/useAdmin';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import { BellPlus, BellRing, FileClock, Home, ListOrdered, LogOut, PackageSearch, PencilRuler, Settings, Store, Users, Wallet } from 'lucide-react';
import SidebarItem from './sidebar.item';
import SidebarMenu from './sidebar.menu';

const SidebarWrapper = () => {
  const { activeSideBar, setActiveSideBar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSideBar(pathName);
  }, [pathName, setActiveSideBar]);

  const getIconColor = (route: string) => activeSideBar === route ? "#0085ff" : "#969696";
  return (
    <Box css={{ height: "100vh", zIndex: 202, position: "sticky", padding: "8px", top: "0", overflowY: "scroll", scrollbarWidth: "none" }} className='sidebar-wrapper'>
      <Sidebar.Header>
        <Box>
          <Link href={'/'} className="flex justify-center text-center gap-2">
            {/* Put your logo here */}
            {/* <Logo /> */}
            <Box>
              <h3 className='text-xl font-medium text-[#ecedee]'>
                {admin?.name}
              </h3>
              <h5 className='font-medium pl-2 text-xs text-[#ecedeecf] whitespace-normal'>
                {admin?.email}
              </h5>
            </Box>
          </Link>
        </Box>

      </Sidebar.Header>

      <div className='block my-3 h-ful'>
        <Sidebar.Body className='body sidebar'>
          <SidebarItem title="Dashboard" icon={<Home fill={getIconColor("/dashboard")} />} isActive={activeSideBar === "/dashboard"} href="/dashboard" />
          <div className='mt-2 block'>
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSideBar === "/dashbord/orders"}
                title='Orders'
                href='/dashboard/orders'
                icon={<ListOrdered size={26} fill={getIconColor("/dashboard/orders")} />}
              />

              <SidebarItem
                isActive={activeSideBar === "/dashbord/payments"}
                title='Payments'
                href='/dashboard/payments'
                icon={<Wallet fill={getIconColor("/dashboard/payments")} />}
              />

              <SidebarItem
                isActive={activeSideBar === "/dashbord/products"}
                title='Products'
                href='/dashboard/products'
                icon={<PackageSearch fill={getIconColor("/dashboard/products")} />}
              />
              
              <SidebarItem
                isActive={activeSideBar === "/dashbord/events"}
                title='Events'
                href='/dashboard/events'
                icon={<BellPlus fill={getIconColor("/dashboard/events")} />}
              />

               <SidebarItem
                isActive={activeSideBar === "/dashbord/events"}
                title='Events'
                href='/dashboard/events'
                icon={<BellPlus fill={getIconColor("/dashboard/events")} />}
              />

               <SidebarItem
                isActive={activeSideBar === "/dashbord/users"}
                title='Users'
                href='/dashboard/users'
                icon={<Users fill={getIconColor("/dashboard/users")} />}
              />

              <SidebarItem
                isActive={activeSideBar === "/dashbord/sellers"}
                title='Sellers'
                href='/dashboard/sellers'
                icon={<Store fill={getIconColor("/dashboard/sellers")} />}
              />
            </SidebarMenu>

            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSideBar === "/dashbord/loggers"}
                title='Loggers'
                href='/dashboard/loggers'
                icon={<FileClock size={22} fill={getIconColor("/dashboard/loggers")} />}
              />

              <SidebarItem
                isActive={activeSideBar === "/dashbord/management"}
                title='Management'
                href='/dashboard/management'
                icon={<Settings size={22} fill={getIconColor("/dashboard/management")} />}
              />

              <SidebarItem
                isActive={activeSideBar === "/dashbord/notifications"}
                title='Notifications'
                href='/dashboard/notifications'
                icon={<BellRing size={22} fill={getIconColor("/dashboard/notifications")} />}
              />    
            </SidebarMenu>

            <SidebarMenu title="Customization">
              <SidebarItem
                isActive={activeSideBar === "/dashbord/customization"}
                title='All Customization'
                href='/dashboard/customization'
                icon={<PencilRuler size={22} fill={getIconColor("/dashboard/customization")} />}
              />
            </SidebarMenu>

            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSideBar === "/logout"}
                title='Logout'
                href='/'
                icon={<LogOut size={22} fill={getIconColor("/logout")} />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  )
}

export default SidebarWrapper