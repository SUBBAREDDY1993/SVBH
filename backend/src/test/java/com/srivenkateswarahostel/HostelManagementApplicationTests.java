package com.srivenkateswarahostel;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.data.mongodb.uri=mongodb://localhost:27017/svboys_hostel_test"
})
class HostelManagementApplicationTests {

    @Test
    void contextLoads() {
    }
}
