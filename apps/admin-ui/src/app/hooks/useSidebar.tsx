import { useAtom } from 'jotai'
import { activeSideBarItem } from '../../configs/constants';


const useSidebar = () => {
    const [activeSideBar, setActiveSideBar] = useAtom(activeSideBarItem);
  return {
    activeSideBar,
    setActiveSideBar
  }
}

export default useSidebar