import { Link } from "react-router-dom";
import { Layout, Button } from "../../components";
import { ROUTES } from "../../constants";
import { Plus } from "../../assets";

const ApplicantTracker = () => {
  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
              Applicant Tracker
            </h1>
            <p className="mt-2 text-slate-600">Track all your applicants here.</p>
          </div>
          <Link to={ROUTES.CREATE_APPLICANT}>
            <Button variant="accent" leftIcon={<Plus className="w-5 h-5" />}>
              Add Applicant
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ApplicantTracker;

