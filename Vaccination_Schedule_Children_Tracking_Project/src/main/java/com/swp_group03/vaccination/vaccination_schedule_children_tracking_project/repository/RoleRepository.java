package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    @Query("SELECT r FROM Role r WHERE r.role_Name = :roleName")
    Optional<Role> findByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT r FROM Role r WHERE r.role_Name IN :roleNames")
    List<Role> findAllByRoleNames(@Param("roleNames") List<String> roleNames);
} 