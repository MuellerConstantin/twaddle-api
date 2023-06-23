import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import {Strategy as CustomStrategy} from 'passport-custom';
import env from '../config/env';
import redis from '../config/redis';
import User from '../models/user';

passport.use(
  'credentials',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
    },
    (email, password, done) => {
      User.findOne({email})
        .then((user) => {
          if (!user) {
            return done(null, false);
          }

          if (!user.isValidPassword(password)) {
            return done(null, false);
          }

          return done(null, user);
        })
        .catch((err) => done(err));
    },
  ),
);

passport.use(
  'accessToken',
  new JwtStrategy(
    {
      secretOrKey: env.authToken.secret,
      issuer: env.authToken.issuer,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    (payload, done) => {
      User.findById(payload.sub)
        .then((user) => {
          if (!user) {
            return done(null, false);
          }

          return done(null, user);
        })
        .catch((err) => done(err));
    },
  ),
);

passport.use(
  'refreshToken',
  new CustomStrategy((req, done) => {
    try {
      const {refreshToken} = req.body;

      redis
        .get(`refreshToken:${refreshToken}`)
        .then(async (subject) => {
          if (!subject) {
            return done(null, false);
          }

          return User.findById(subject)
            .then((user) => {
              if (!user) {
                return done(null, false);
              }

              return done(null, user);
            })
            .catch((err) => done(err));
        })
        .catch((err) => done(err));
    } catch (err) {
      done(err);
    }
  }),
);

export default passport;
