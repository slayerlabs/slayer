import LeaderboardLive from "./live";
import PolNativeBoard from "./polnative";

export const metadata = {
  title: "Leaderboard — Bielik-11B-v3 vs Qwen3.5-9B | Slayer",
  description: "Wyniki na żywo: Bielik-11B-v3 vs Qwen3.5-9B na 10 benchmarkach. Autonomiczna kolejka, czysty pomiar.",
};

export default function Leaderboard() {
  return (
    <main className="sl">
      <section className="sl-sec">
        <div className="sl-inner">
          <div className="sl-mast">
            <div className="sl-mast-code"><b>leaderboard</b><span>/ benchmarki</span></div>
            <div>
              <div className="sl-eye">leaderboard · natywność + benchmarki zewnętrzne</div>
              <h1 className="sl-h1" style={{ marginTop: 10 }}>Wyniki <span className="sl-acc">na żywo.</span></h1>
              <p className="sl-lede" style={{ marginTop: 12 }}>
                <span className="sl-status sl-run">live · auto-sync</span>
              </p>
            </div>
          </div>

          <PolNativeBoard />

          <hr className="sl-rule" style={{ margin: "clamp(40px,6vw,64px) 0 0" }} />
          <div className="sl-eye" style={{ marginTop: "clamp(28px,4vw,40px)" }}>benchmarki zewnętrzne · Bielik-11B-v3 vs Qwen3.5-9B</div>

          <LeaderboardLive />
        </div>
      </section>
    </main>
  );
}
