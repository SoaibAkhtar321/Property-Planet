import AccountSettingBody from "./AccountSettingBody";

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. AccountSettingBody already renders DashboardHeaderTwo,
// which renders the real, correctly wired DashboardHeaderOne itself.
const DashboardAccountSetting = () => {
   return (
      <>
         <AccountSettingBody />
      </>
   )
}

export default DashboardAccountSetting;
