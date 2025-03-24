import "./App.css";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutUsPage from "./pages/AboutUsPage";
import VaccineList from "./pages/VaccineList";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPAge";
import AccountManage from "./admin/AccountManage";
import VaccineManage from "./admin/VaccineManage";
import VaccineComboManage from "./admin/VaccineComboManage";
import ScheduleManage from "./admin/ScheduleManage";
import ProfilePage from "./user/ProfilePage";
import ChildrenManagement from "./user/ChildrenManagement";
import WorkScheduleView from "./employee/components/WorkScheduleView";
import PaymentList from "./admin/payment/PaymentList";
import PaymentManage from './admin/payment/PaymentManage';
import HealthRecord from './pages/HealthRecord';
import HealthRecordDetail from './pages/HealthRecordDetail';
import PaymentResult from './pages/PaymentResult';
import PaymentExample from './pages/PaymentExample';
import AppointmentCreation from './user/AppointmentCreation';
import AppointmentList from './user/AppointmentList';
import PaymentStatus from './user/PaymentStatus';
import MomoDebug from './components/payment/MomoDebug';

// Create placeholder components for the routes we'll implement later
const VaccinationHistoryPage = () => <div>Vaccination History page will be implemented soon.</div>;
const ServicePackagePage = () => <div>Service Package page will be implemented soon.</div>;
const VaccineDetailPage = () => <div>Vaccine Detail page will be implemented soon.</div>;

function App() {
	return (
		<Routes>
			<Route path={"/"} element={<HomePage />} />
			<Route path={"/AboutUs"} element={<AboutUsPage />} />
			<Route path={"/vaccines"} element={<VaccineList />} />
			<Route path={"/vaccine/:id"} element={<VaccineDetailPage />} />
			<Route path={"/Login"} element={<LoginPage />} />
			<Route path={"/Register"} element={<RegisterPage />} />
			
			{/* User pages */}
			<Route path={"/profile"} element={<ProfilePage />} />
			<Route path={"/children"} element={<ChildrenManagement />} />
			<Route path={"/booking"} element={<AppointmentCreation />} />
			<Route path={"/appointment-creation"} element={<AppointmentCreation />} />
			<Route path={"/appointments"} element={<AppointmentList />} />
			<Route path={"/vaccination-history"} element={<VaccinationHistoryPage />} />
			<Route path={"/service-package"} element={<ServicePackagePage />} />
			<Route path={"/health-records"} element={<HealthRecord />} />
			<Route path={"/health-records/:id"} element={<HealthRecordDetail />} />
			<Route path={"/payment/result"} element={<PaymentResult />} />
			<Route path={"/payment/example"} element={<PaymentExample />} />
			<Route path={"/payment/status"} element={<PaymentStatus />} />
			<Route path={"/payment/debug"} element={<MomoDebug />} />

			{/*Admin page*/}
			<Route path={"/ManageAccount"} element={<AccountManage />} />
			<Route path={"/ManageVaccine"} element={<VaccineManage />} />
			<Route path={"/ManageCombo"} element={<VaccineComboManage />} />
			<Route path={"/ManageSchedule"} element={<ScheduleManage />} />
			<Route path={"/WorkSchedule"} element={<WorkScheduleView />} />
			<Route path={"/shift-requests"} element={<WorkScheduleView activeTab="requests" />} />
			<Route path={"/ManagePayment"} element={<PaymentManage />} />
		</Routes>
	);
}

export default App;
