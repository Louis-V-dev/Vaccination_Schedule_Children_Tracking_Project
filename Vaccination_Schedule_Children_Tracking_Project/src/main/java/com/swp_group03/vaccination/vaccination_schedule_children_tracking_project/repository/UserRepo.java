package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepo extends JpaRepository<Account, String> {
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Account a WHERE a.username = :username")
    boolean existsByUsername(@Param("username") String username);

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.roles WHERE a.username = :username")
    Optional<Account> findByUsername(@Param("username") String username);

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.roles WHERE a.email = :email")
    Optional<Account> findByEmail(@Param("email") String email);

    @Query("SELECT DISTINCT a FROM Account a JOIN a.roles r WHERE r IN :roles")
    List<Account> findByRolesIn(@Param("roles") Set<Role> roles);

    @Query("SELECT DISTINCT a FROM Account a JOIN a.roles r WHERE r.role_Name = :role_Name")
    List<Account> findByRolesRole_Name(@Param("role_Name") String role_Name);
}
