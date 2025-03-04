package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_DEFAULT)
public class AccountResponse {
    private String accountId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private boolean status;
    private Set<String> roles;
}
