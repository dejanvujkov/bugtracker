import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  InjectionToken,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { SqliteDriver } from './database/sqlite/sqlite.driver';
import { runMigrations } from './database/migrations';
import { runSeed } from './database/seed';
import { createRepositories, REPOS } from './database/repository-factory';

function initDatabase(driver: SqliteDriver) {
  return async () => {
    await driver.init();
    runMigrations(driver);
    await runSeed(driver);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    SqliteDriver,
    {
      provide: APP_INITIALIZER,
      useFactory: initDatabase,
      deps: [SqliteDriver],
      multi: true,
    },
    {
      provide: REPOS,
      useFactory: (driver: SqliteDriver) => createRepositories(driver),
      deps: [SqliteDriver],
    },
  ],
};
