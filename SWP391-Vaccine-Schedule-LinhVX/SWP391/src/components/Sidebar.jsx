import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
	return (
		<div className="admin-sidebar">
			<div className="sidebar-header">Dashboard</div>
			<NavLink to="/ManageAccount" className={({isActive}) => isActive ? "active" : ""}>
				<i className="fas fa-user"></i>
				Account
			</NavLink>
			<NavLink to="/ManageVaccine" className={({isActive}) => isActive ? "active" : ""}>
				<i className="fas fa-syringe"></i>
				Vaccine
			</NavLink>
			<NavLink to="/ManageCombo" className={({isActive}) => isActive ? "active" : ""}>
				<i className="fas fa-vials"></i>
				Vaccine Combo
			</NavLink>
			<NavLink to="/ManageSchedule" className={({isActive}) => isActive ? "active" : ""}>
				<i className="fas fa-calendar-alt"></i>
				Manage Schedule
			</NavLink>
			<NavLink to="/ManagePayment" className={({isActive}) => isActive ? "active" : ""}>
				<i className="fas fa-money-bill-wave"></i>
				Payments
			</NavLink>
		</div>
	);
}

export default Sidebar;
