/**
 * The pricing block, shared by the Landing page and the film (scene S10). Two plain tiers side by side, the way
 * the best subscription pages show it: what is free, then what Plus is, its two prices with their trials, and what
 * it includes; one promise underneath. Every figure and word comes from site.ts (prices from content/pricing.ts).
 * Server-rendered and static, so it reads the same with no JavaScript and with reduced motion.
 */
import { site } from '@/content/site';
import styles from './PricingPlans.module.css';

const copy = site.scenes.s10;

export function PricingPlans() {
  const { free, plus } = copy;
  return (
    <div className={styles.wrap}>
      <div className={styles.tiers} role="group" aria-label={copy.support}>
        <section className={`${styles.tier} ${styles.free}`} aria-labelledby="tier-free">
          <p className={styles.tierName} id="tier-free">
            {free.name}
          </p>
          <p className={styles.tierTitle}>{free.title}</p>
          <p className={styles.note}>{free.note}</p>
        </section>

        <section className={`${styles.tier} ${styles.plus}`} aria-labelledby="tier-plus">
          <p className={styles.tierName} id="tier-plus">
            {plus.name}
          </p>
          <p className={styles.tierTitle}>{plus.title}</p>
          <ul className={styles.plans}>
            {plus.plans.map((plan) => (
              <li key={plan.name} className={styles.plan}>
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.price}>
                  {plan.price}
                  <span className={styles.per}> {plan.per}</span>
                </span>
                <span className={styles.trial}>
                  {plan.trial} {plus.trialNote}
                </span>
              </li>
            ))}
          </ul>
          <ul className={styles.includes}>
            {plus.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
      <p className={styles.promise}>{copy.promise}</p>
    </div>
  );
}
