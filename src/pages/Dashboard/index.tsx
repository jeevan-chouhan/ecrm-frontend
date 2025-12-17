import { Layout } from "../../components";

const Dashboard = () => {
  return (
    <Layout
      userName="Admin"
      userRole="Abroad Agency"
      notificationCount={3}
      onNotificationClick={() => console.log("Notifications clicked")}
      onProfileClick={() => console.log("Profile clicked")}
      onLogoutClick={() => console.log("Logout clicked")}
    >
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Welcome to E-CRM Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Your dashboard content goes here.
        </p>
      </div>
    </Layout>
  );
};

export default Dashboard;

