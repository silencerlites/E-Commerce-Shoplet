import Header from '../shared/widgets/header';
import './global.css';
import {Poppins, Roboto} from "next/font/google"
import Providers from './providers';
import Footer from '../shared/widgets/footer/footer';

export const metadata = {
  title: 'Shoplet',
  description: 'Your Shopping Outlet',
}

const poppins = Poppins({ subsets: ['latin'], weight: ['100', '200', '300', '400', '500', '600', '700', '900'], variable: '--font-poppins' });
const roboto = Roboto({ subsets: ['latin'], weight: ['100', '300', '400', '500', '700', '900'], variable: '--font-roboto' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${roboto.variable}`}>
       < Providers>
        <Header />
        {children}
        <Footer />
        </Providers>
        </body>
    </html>
  )
}
