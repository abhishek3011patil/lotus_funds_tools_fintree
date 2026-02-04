import SidebarCommon from "../common/Sidebar";
import type { SidebarProps as CommonSidebarProps } from "../common/Sidebar";
import { appSidebarItems } from "../../config/sidebarItems";

const Sidebar = (props: Omit<CommonSidebarProps, "items">) => {
  return <SidebarCommon {...props} items={appSidebarItems} />;
};

export default Sidebar;
