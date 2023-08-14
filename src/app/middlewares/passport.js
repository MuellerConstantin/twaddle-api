import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import {Strategy as CustomStrategy} from 'passport-custom';
import bcrypt from 'bcryptjs';
import env from '../config/env';
import redis from '../config/redis';
import User from '../models/user';

passport.use(
  'credentials',
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      session: false,
    },
    (username, password, done) => {
      User.findOne({username})
        .then((user) => {
          if (!user) {
            return done(null, false);
          }

          if (!bcrypt.compareSync(password, user.password)) {
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

passport.use(
  "ticket",
  new CustomStrategy((req, done) => {
    try {
      const ticket = new URL(
        req.url,
        `http://${req.headers.host}`
      ).searchParams.get("ticket");

      redis
        .get(`ticket:${ticket}`)
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
  })
);

export default passport;
