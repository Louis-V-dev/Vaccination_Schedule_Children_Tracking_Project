package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
/*import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;*/
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.Nationalized;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;

@Entity
@Table(name = "Accounts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "account_id")
    private String accountId;

    @Column(name = "username", length = 30,unique=true)
    @Size(min = 6, max = 30, message = "Tên đăng nhập phải có ít nhất 6 ký tự và nhiều nhất 30 ký tự !!")
    private String username;

    @Column(name = "password")
//    @Size(min = 8, max = 20, message = "Mật khẩu phải có ít nhất 8 ký tự và nhiều nhất 20 ký tự !!")
//    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[\\W]).{8,20}$", message = "Mật Khẩu nên có ít nhất 1 ký tự đặc biệt và 1 chữ" +
//            " in hoa !!")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(name = "first_name", length = 100)
    @Nationalized
    @Size(max = 100, message = "first_name không được vượt quá 100 ký tự !!")
    private String firstName;

    @Column(name = "last_name", length = 100)
    @Nationalized
    @Size(max = 100, message = "last_name không được vượt quá 100 ký tự !!")
    private String lastName;

    @Column(name = "email", length = 50)
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$", message = "Please enter right email")
    @Size(max = 50, message = "Email không được vượt quá 50 ký tự !!")
    private String email;

    @Column(name = "phone_number", length = 10)
    @Pattern(regexp = "^0[0-9]{9}$", message = "Enter correct Phone number")
    private String phoneNumber;

    @Column(name = "address", length = 100)
    @Nationalized
    @Size(max = 100, message = "Địa chỉ không được vượt quá 100 ký tự !!")
    private String address;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Enumerated(EnumType.STRING) // Use STRING to store the enum as a string in the database
    @Column(name = "gender", length = 6)
    private Gender gender; // Change from String to Gender enum

    @Column(name = "status")
    private boolean status;

    @Column(name = "url_image")
    private String urlImage;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_code_expiry")
    private LocalDateTime verificationCodeExpiry;

    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "Account_Role",
            joinColumns = @JoinColumn(name = "Account_ID"),
            inverseJoinColumns = @JoinColumn(name = "Role_ID"))
    private Set<Role> roles = new HashSet<>();
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "Role_ID")
//    private Account_Role role;lll

    @OneToMany(mappedBy = "account_Id", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("account_Id")
    private List<Child> children;

    public Account() {}

    public Account(String accountId, String username, String password, String firstName, String lastName, String email, String phoneNumber, String address, Gender gender, boolean status, String urlImage, Set<Role> roles) {
        this.accountId = accountId;
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.gender = gender;
        this.status = status;
        this.urlImage = urlImage;
        this.roles = roles;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public String getUrlImage() {
        return urlImage;
    }

    public void setUrlImage(String urlImage) {
        this.urlImage = urlImage;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public LocalDateTime getVerificationCodeExpiry() {
        return verificationCodeExpiry;
    }

    public void setVerificationCodeExpiry(LocalDateTime verificationCodeExpiry) {
        this.verificationCodeExpiry = verificationCodeExpiry;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    //
//    public Account(String username, String password, String first_Name, String last_Name, String email,
//                   String phone_number, String address, String gender, boolean status, String url_image,
//                   Account_Role role) {
//        this.username = username;
//        this.password = password;
//        First_Name = first_Name;
//        Last_Name = last_Name;
//        Email = email;
//        Phone_number = phone_number;
//        Address = address;
//        Gender = gender;
//        Status = status;
//        this.urlIimage = url_image;
//        this.role = role;
//    }
//
//    public String getAccount_ID() {
//        return Account_ID;
//    }
//
//    public String getUsername() {
//        return username;
//    }
//
//    public void setUsername(String username) {
//        this.username = username;
//    }
//
//    public String getPassword() {
//        return password;
//    }
//
//    public void setPassword(String password) {
//        this.password = password;
//    }
//
//    public String getFirst_Name() {
//        return First_Name;
//    }
//
//    public void setFirstName(String first_Name) {
//        First_Name = first_Name;
//    }
//
//    public String getLast_Name() {
//        return Last_Name;
//    }
//
//    public void setLastName(String last_Name) {
//        Last_Name = last_Name;
//    }
//
//    public String getEmail() {
//        return Email;
//    }
//
//    public void setEmail(String email) {
//        Email = email;
//    }
//
//    public String getPhone_number() {
//        return Phone_number;
//    }
//
//    public void setPhone_number(String phone_number) {
//        Phone_number = phone_number;
//    }
//
//    public String getAddress() {
//        return Address;
//    }
//
//    public void setAddress(String address) {
//        Address = address;
//    }
//
//    public String getGender() {
//        return Gender;
//    }
//
//    public void setGender(String gender) {
//        Gender = gender;
//    }
//
//    public boolean isStatus() {
//        return Status;
//    }
//
//    public void setStatus(boolean status) {
//        Status = status;
//    }
//
//    public String getUrl_image() {
//        return urlIimage;
//    }
//
//    public void setUrlimage(String urlImage) {
//        this.urlIimage = urlImage;
//    }
//
//    public Account_Role getRole() {
//        return role;
//    }
//
//    public void setRole(Account_Role role) {
//        this.role = role;
//    }
}
