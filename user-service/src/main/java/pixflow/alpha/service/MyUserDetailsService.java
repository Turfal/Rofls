package pixflow.alpha.service;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import pixflow.alpha.config.MyUserDetails;
import pixflow.alpha.model.User;
import pixflow.alpha.repository.UserRepository;

import java.util.Optional;

@Data
@Service
public class MyUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = userRepository.findByUsername(username);

        return user.map(MyUserDetails::new)
                .orElseThrow(()->new UsernameNotFoundException(username+"There is not such user in Repository"));
    }
}
