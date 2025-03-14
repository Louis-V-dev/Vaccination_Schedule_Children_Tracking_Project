package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface ChildRepo extends JpaRepository<Child, String> {
    /**
     * Find all children associated with a specific guardian account
     * @param account The guardian account
     * @return List of children
     */
    @Query("SELECT c FROM Child c WHERE c.account_Id = :account")
    List<Child> findByAccount_Id(@Param("account") Account account);
    
    /**
     * Find all children associated with a specific guardian account with pagination
     * @param account The guardian account
     * @param pageable Pagination information
     * @return Page of children
     */
    @Query("SELECT c FROM Child c WHERE c.account_Id = :account")
    Page<Child> findByAccount_Id(@Param("account") Account account, Pageable pageable);
    
    /**
     * Search for children by name (case-insensitive containing match)
     * @param name Part of the child's name
     * @return List of matching children
     */
    @Query("SELECT c FROM Child c WHERE LOWER(c.child_name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Child> findByChildNameContainingIgnoreCase(@Param("name") String name);
    
    /**
     * Find children born on or after a specific date
     * @param date The date to compare against
     * @return List of children
     */
    List<Child> findByDobGreaterThanEqual(Date date);
    
    /**
     * Find children born on or before a specific date
     * @param date The date to compare against
     * @return List of children
     */
    List<Child> findByDobLessThanEqual(Date date);
    
    /**
     * Find children by gender
     * @param gender The gender to filter by
     * @return List of children
     */
    List<Child> findByGender(String gender);
    
    /**
     * Find children by blood type
     * @param bloodType The blood type to filter by
     * @return List of children
     */
    List<Child> findByBloodType(String bloodType);
    
    /**
     * Find children with specific allergies (case-insensitive containing match)
     * @param allergies Part of the allergies description
     * @return List of children
     */
    List<Child> findByAllergiesContainingIgnoreCase(String allergies);
    
    /**
     * Find children with specific medical conditions (case-insensitive containing match)
     * @param condition Part of the medical condition description
     * @return List of children
     */
    List<Child> findByMedicalConditionsContainingIgnoreCase(String condition);
    
    /**
     * Search children by multiple criteria
     * @param name Part of the child's name (optional)
     * @param gender The gender (optional)
     * @param bloodType The blood type (optional)
     * @return List of matching children
     */
    @Query("SELECT c FROM Child c WHERE " +
           "(:name IS NULL OR LOWER(c.child_name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:gender IS NULL OR c.gender = :gender) AND " +
           "(:bloodType IS NULL OR c.bloodType = :bloodType)")
    List<Child> searchChildren(@Param("name") String name, 
                               @Param("gender") String gender, 
                               @Param("bloodType") String bloodType);

    List<Child> findByActiveTrue();
    
    @Query("SELECT c FROM Child c WHERE c.account_Id = :account AND c.active = true")
    List<Child> findByAccount_IdAndActiveTrue(@Param("account") Account account);
    
    @Query("SELECT c FROM Child c WHERE c.account_Id = :account AND c.active = true")
    Page<Child> findByAccount_IdAndActiveTrue(@Param("account") Account account, Pageable pageable);
    
    @Query("SELECT c FROM Child c WHERE LOWER(c.child_name) LIKE LOWER(CONCAT('%', :name, '%')) AND c.active = true")
    List<Child> findByChildNameContainingIgnoreCaseAndActiveTrue(@Param("name") String name);
    
    List<Child> findByActiveTrueAndDobBetween(Date fromDate, Date toDate);
    
    List<Child> findByActiveTrueAndDobGreaterThanEqual(Date date);
    
    List<Child> findByActiveTrueAndDobLessThanEqual(Date date);
    
    List<Child> findByBloodTypeAndActiveTrue(String bloodType);
    
    List<Child> findByAllergiesContainingIgnoreCaseAndActiveTrue(String allergies);
    
    List<Child> findByMedicalConditionsContainingIgnoreCaseAndActiveTrue(String condition);
    
    @Query("SELECT c FROM Child c WHERE c.active = true AND " +
           "(:name IS NULL OR LOWER(c.child_name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:gender IS NULL OR c.gender = :gender) AND " +
           "(:bloodType IS NULL OR c.bloodType = :bloodType)")
    List<Child> searchActiveChildren(@Param("name") String name, 
                                   @Param("gender") String gender, 
                                   @Param("bloodType") String bloodType);
}
