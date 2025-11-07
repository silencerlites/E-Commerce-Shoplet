"use client";

import useSeller from 'apps/seller-ui/src/hooks/useSeller';
import useSidebar from 'apps/seller-ui/src/hooks/useSidebar';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import { BellRing, Calendar, CalendarPlus, Home, Inbox, ListOrdered, LogOut, Package, PlusCircle, Settings, TicketCheck, Wallet } from 'lucide-react';
import SidebarItem from './sidebar.item';
import SidebarMenu from './sidebar.menu';

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();

  console.log(seller)

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) => activeSidebar === route ? "#0085ff" : "#969696";
  return (
    <Box css={{ height: "100vh", zIndex: 202, position: "sticky", padding: "8px", top: "0", overflowY: "scroll", scrollbarWidth: "none" }} className='sidebar-wrapper'>

      <Sidebar.Header>
        <Box>
          <Link href={'/'} className='flex justify-center text-center gap-2'>
            {/* LOGO */}
            <Home />
            <Box>
              <h3 className='text-xl font-medium text-[#ecedee]'>{seller?.shop?.name}</h3>
              <h5 className='font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]'>
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className='block my-3 h-full'>

        <Sidebar.Body className='body sidebar'>

          <SidebarItem
            title="Dashboard"
            icon={<Home fill={getIconColor("/dashbord")} />}
            isActive={activeSidebar === "/dashboard"}
            href='/dashboard' />

          <div className='mt-2 block'>
            <SidebarMenu title="Main Menu" >
              <SidebarItem
                title="Orders"
                icon={<ListOrdered fill={getIconColor("/dashboard/orders")} />}
                isActive={activeSidebar === "/dashboard/orders"}
                href='/dashboard/orders' />

                <SidebarItem
                title="Payments"
                icon={<Wallet fill={getIconColor("/dashboard/payments")} />}
                isActive={activeSidebar === "/dashboard/payments"}
                href='/dashboard/payments' />
            </SidebarMenu>

            <SidebarMenu title='Products'>
               <SidebarItem
                title="Create Product"
                icon={<PlusCircle fill={getIconColor("/dashboard/create-product")} />}
                isActive={activeSidebar === "/dashboard/create-product"}
                href='/dashboard/create-product' />
                
                <SidebarItem
                title="All Products"
                icon={<Package fill={getIconColor("/dashboard/all-products")} />}
                isActive={activeSidebar === "/dashboard/all-products"}
                href='/dashboard/all-products' />
            </SidebarMenu>

            <SidebarMenu title='Events'>
               <SidebarItem
                title="Create Event"
                icon={<CalendarPlus fill={getIconColor("/dashboard/create-event")} />}
                isActive={activeSidebar === "/dashboard/create-event"}
                href='/dashboard/create-event' />
                
                <SidebarItem
                title="All Events"
                icon={<Calendar fill={getIconColor("/dashboard/all-events")} />}
                isActive={activeSidebar === "/dashboard/all-events"}
                href='/dashboard/all-events' />
            </SidebarMenu>

            <SidebarMenu title='Controllers'>
               <SidebarItem
                title="Inbox"
                icon={<Inbox fill={getIconColor("/dashboard/inbox")} />}
                isActive={activeSidebar === "/dashboard/inbox"}
                href='/dashboard/inbox' />
                
                <SidebarItem
                title="Settings"
                icon={<Settings fill={getIconColor("/dashboard/settings")} />}
                isActive={activeSidebar === "/dashboard/settings"}
                href='/dashboard/settings' />

                <SidebarItem
                title="Notifications"
                icon={<BellRing fill={getIconColor("/dashboard/notifications")} />}
                isActive={activeSidebar === "/dashboard/notifications"}
                href='/dashboard/notifications' />
            </SidebarMenu>

            <SidebarMenu title='Extras'>
               <SidebarItem
                title="Discount Codes"
                icon={<TicketCheck fill={getIconColor("/dashboard/discount-codes")} />}
                isActive={activeSidebar === "/dashboard/discount-codes"}
                href='/dashboard/discount-codes' />
                
                <SidebarItem
                title="Logout"
                icon={<LogOut fill={getIconColor("/dashboard/logout")} />}
                isActive={activeSidebar === "/dashboard/logout"}
                href='/dashboard/logout' />
            </SidebarMenu>
          </div>
        </Sidebar.Body>

      </div>

    </Box>
  )
}

export default SidebarWrapper