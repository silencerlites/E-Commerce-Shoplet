"use client"

import { useAtom } from "jotai"
import { activeSidebarItem } from "../config/constants"

const useSidebar = () => {
    const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem)
    return { activeSidebar, setActiveSidebar }
}

export default useSidebar;