export const navItems: NavItemsTypes[] = [
    {
        title: 'Home',
        href: '/',
        name: ""
    },
    {
        title: 'Products',
        href: '/products',
        name: ""
    },
    {
        title: 'Shops',
        href: '/shops',
        name: ""
    },
     {
         title: 'Offers',
         href: '/offers',
         name: ""
     },
    {
        title: 'Become a Seller',
        href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
        name: ""
    }, 
]