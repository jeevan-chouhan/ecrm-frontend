import { Layout } from "../../components";

const ManageTeam = () => {
  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Manage Team
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your team members and roles.
        </p>
      </div>
    </Layout>
  );
};

export default ManageTeam;

