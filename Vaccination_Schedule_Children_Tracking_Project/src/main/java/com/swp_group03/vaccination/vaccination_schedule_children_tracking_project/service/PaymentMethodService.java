package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentMethod;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentMethodRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentMethodService {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodRepository.findAll();
    }

    public PaymentMethod getPaymentMethodById(Long id) {
        return paymentMethodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found with id: " + id));
    }

    @Transactional
    public PaymentMethod createPaymentMethod(PaymentMethod paymentMethod) {
        // Validate payment method code uniqueness
        if (paymentMethodRepository.existsByCode(paymentMethod.getCode())) {
            throw new IllegalArgumentException("Payment method with code " + paymentMethod.getCode() + " already exists");
        }
        return paymentMethodRepository.save(paymentMethod);
    }

    @Transactional
    public PaymentMethod updatePaymentMethod(Long id, PaymentMethod paymentMethod) {
        PaymentMethod existingMethod = getPaymentMethodById(id);
        
        // Check if code is being changed and if new code already exists
        if (!existingMethod.getCode().equals(paymentMethod.getCode()) &&
            paymentMethodRepository.existsByCode(paymentMethod.getCode())) {
            throw new IllegalArgumentException("Payment method with code " + paymentMethod.getCode() + " already exists");
        }

        // Update fields
        existingMethod.setName(paymentMethod.getName());
        existingMethod.setCode(paymentMethod.getCode());
        existingMethod.setType(paymentMethod.getType());
        existingMethod.setDescription(paymentMethod.getDescription());
        existingMethod.setLogoUrl(paymentMethod.getLogoUrl());
        existingMethod.setApiEndpoint(paymentMethod.getApiEndpoint());
        existingMethod.setMerchantId(paymentMethod.getMerchantId());
        existingMethod.setPublicKey(paymentMethod.getPublicKey());
        existingMethod.setIsActive(paymentMethod.getIsActive());
        existingMethod.setIsOnline(paymentMethod.getIsOnline());
        existingMethod.setDisplayOrder(paymentMethod.getDisplayOrder());
        existingMethod.setDisplayInstructions(paymentMethod.getDisplayInstructions());

        return paymentMethodRepository.save(existingMethod);
    }

    @Transactional
    public void deletePaymentMethod(Long id) {
        PaymentMethod method = getPaymentMethodById(id);
        paymentMethodRepository.delete(method);
    }

    public List<PaymentMethod> getActivePaymentMethods() {
        return paymentMethodRepository.findByIsActiveTrue();
    }

    public List<PaymentMethod> getOnlinePaymentMethods() {
        return paymentMethodRepository.findByIsOnlineTrue();
    }
} 