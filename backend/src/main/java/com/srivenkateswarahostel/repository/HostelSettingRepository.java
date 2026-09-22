package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.HostelSetting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HostelSettingRepository extends MongoRepository<HostelSetting, String> {
}
