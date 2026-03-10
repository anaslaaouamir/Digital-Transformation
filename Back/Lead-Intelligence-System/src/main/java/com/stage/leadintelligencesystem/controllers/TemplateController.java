package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.TemplateUpdateDto;
import com.stage.leadintelligencesystem.entities.MessageTemplate;
import com.stage.leadintelligencesystem.entities.SequenceStep;
import com.stage.leadintelligencesystem.repositories.MessageTemplateRepository;
import com.stage.leadintelligencesystem.repositories.SequenceStepRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TemplateController {

    private final MessageTemplateRepository templateRepository;
    private final SequenceStepRepository stepRepository;

    public TemplateController(MessageTemplateRepository messageTemplateRepository, SequenceStepRepository sequenceStepRepository) {
        this.templateRepository = messageTemplateRepository;
        this.stepRepository = sequenceStepRepository;
    }


    @PutMapping("/api/templates/bulk-update")
    public void bulkUpdate(@RequestBody List<TemplateUpdateDto> updates) {
        for (TemplateUpdateDto update : updates) {
            MessageTemplate template = templateRepository.findById(update.getTemplateId())
                    .orElseThrow(() -> new RuntimeException("Template not found: " + update.getTemplateId()));
            template.setSubject(update.getSubject());
            template.setBody(update.getBody());
            templateRepository.save(template);

            SequenceStep step = stepRepository.findByTemplateId(update.getTemplateId())
                    .orElse(null);
            if (step != null) {
                step.setDelayDays(update.getDelayDays());
                stepRepository.save(step);
            }
        }
    }

    @GetMapping("/api/templates")
    public List<SequenceStep> getAllSteps() {
        return stepRepository.findAll();
    }
}
