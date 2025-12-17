import { Layout } from "../../components";

const Settings = () => {
  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Settings
        </h1>
        <p className="mt-2 text-slate-600">Configure your application settings.</p>
      </div>
    </Layout>
  );
};

export default Settings;

