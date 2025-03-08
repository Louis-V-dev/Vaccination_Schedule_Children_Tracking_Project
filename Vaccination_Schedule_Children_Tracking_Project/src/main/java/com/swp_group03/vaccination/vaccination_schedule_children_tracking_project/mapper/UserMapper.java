package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserUpdate;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AccountResponse;
import org.mapstruct.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS)
public interface UserMapper {
    
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "status", constant = "true")
    @Mapping(target = "accountId", ignore = true)
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "dateOfBirth", source = "dateOfBirth")
    @Mapping(target = "gender", source = "gender")
    @Mapping(target = "urlImage", source = "urlImage")
    Account toCreateUser(UserRequest request);

    @Mapping(target = "username", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "dateOfBirth", source = "dateOfBirth")
    @Mapping(target = "gender", source = "gender")
    @Mapping(target = "urlImage", source = "urlImage")
    void toUpdateUser(UserUpdate request, @MappingTarget Account account);

    @Mapping(target = "accountId", source = "accountId")
    @Mapping(target = "username", source = "username")
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "dateOfBirth", source = "dateOfBirth")
    @Mapping(target = "address", source = "address")
    @Mapping(target = "gender", source = "gender")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "roles", expression = "java(mapRoles(account))")
    AccountResponse toAccountResponse(Account account);

    List<AccountResponse> toAllAccountResponse(List<Account> accountList);

    default Set<String> mapRoles(Account account) {
        if (account == null || account.getRoles() == null || account.getRoles().isEmpty()) {
            return Set.of("USER");
        }
        return account.getRoles().stream()
                .filter(role -> role != null && role.getRole_Name() != null)
                .map(role -> role.getRole_Name())
                .collect(Collectors.toSet());
    }
}
