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

// Create placeholder components for the routes we'll implement later
const BookingPage = () => <div>Booking Schedule page will be implemented soon.</div>;
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
			<Route path={"/booking"} element={<BookingPage />} />
			<Route path={"/vaccination-history"} element={<VaccinationHistoryPage />} />
			<Route path={"/service-package"} element={<ServicePackagePage />} />

			{/*Admin page*/}
			<Route path={"/ManageAccount"} element={<AccountManage />} />
			<Route path={"/ManageVaccine"} element={<VaccineManage />} />
			<Route path={"/ManageCombo"} element={<VaccineComboManage />} />
			<Route path={"/ManageSchedule"} element={<ScheduleManage />} />
		</Routes>
	);
}

export default App;
