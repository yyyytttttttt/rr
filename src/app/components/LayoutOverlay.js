'use client'

import LeftMenu from "./menus/LeftMenu"
import BottomNav from "./menus/BottomNav"
import TopBar from "./menus/TopBar"
import { memo } from "react"
function LayoutOverlay({active}) {
  
  return (
    <>
      <TopBar/>

      
        <LeftMenu/>
        <BottomNav/>
        

      
    </>
  )
}
export default memo(LayoutOverlay)
