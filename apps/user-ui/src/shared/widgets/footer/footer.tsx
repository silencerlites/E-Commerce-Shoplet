'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Facebook, Twitter, Linkedin, Mail, MapPin, ArrowUp } from 'lucide-react'

const Footer = () => {
  const [showTopBtn, setShowTopBtn] = useState(false)

  // Show back-to-top button after scrolling 300px
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopBtn(true)
      } else {
        setShowTopBtn(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#f9f9f9] border-t border-gray-200">
      <div className="w-[85%] mx-auto py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Column 1: About */}
        <div>
          <p className="text-gray-700 text-sm mb-4">
            Perfect ecommerce platform to start your business from scratch
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:text-blue-600 transition">
              <Facebook size={16} />
            </Link>
            <Link href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:text-sky-500 transition">
              <Twitter size={16} />
            </Link>
            <Link href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:text-blue-700 transition">
              <Linkedin size={16} />
            </Link>
          </div>
        </div>

        {/* Column 2: My Account */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-3">My Account</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/orders" className="hover:text-blue-500">Track Orders</Link></li>
            <li><Link href="/shipping" className="hover:text-blue-500">Shipping</Link></li>
            <li><Link href="/wishlist" className="hover:text-blue-500">Wishlist</Link></li>
            <li><Link href="/account" className="hover:text-blue-500">My Account</Link></li>
            <li><Link href="/history" className="hover:text-blue-500">Order History</Link></li>
            <li><Link href="/returns" className="hover:text-blue-500">Returns</Link></li>
          </ul>
        </div>

        {/* Column 3: Information */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-3">Information</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="hover:text-blue-500">Our Story</Link></li>
            <li><Link href="/careers" className="hover:text-blue-500">Careers</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-500">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-blue-500">Terms & Conditions</Link></li>
            <li><Link href="/news" className="hover:text-blue-500">Latest News</Link></li>
            <li><Link href="/contact" className="hover:text-blue-500">Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-3">Talk To Us</h3>
          <p className="text-sm text-gray-600">Got Questions? Call us</p>
          <p className="text-lg font-semibold text-gray-800 mt-1">+63 921 285 5232</p>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Mail size={14} />
            <span>lites.liera@gmail.com</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
            <MapPin size={14} className="mt-0.5" />
            <span>Quezon City<br />Philippines, 1105</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-4">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} All Rights Reserved
        </p>
      </div>

      {/* Back to Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition"
          aria-label="Back to Top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </footer>
  )
}

export default Footer
