"""
YouTube Creator Analysis System - 지표 계산 모듈 V2.4 (수정됨)
- Tier별 벤치마크 기준 상대평가
- 개별 지표 100점 cap, 최종 BLC 100점 cap
- Engagement Score: 벤치마크의 1.5배를 만점 기준으로 적용 (더 엄격한 평가)
- Demand Score (15점): 0.5% 이상이면 만점 (Demand per 1K views 기준)
- Problem Score (10점): 0.5% 이상이면 만점 (기존 0.2%에서 상향), 벤치마크 2배를 만점 기준
- Format Fit Score (10점): 포맷 효과 상대 평가
- Consistency (10점): 주간 업로드 횟수 기준
- 뷰티 카테고리 전용
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from collections import Counter
import re

class MetricsCalculator:
    
    # Tier별 벤치마크 (뷰티 카테고리 기준) - V2 Updated
    BENCHMARKS = {
        "Tier_1_Major": {  # 구독자 50만+
            "engagement_per_1k": 30.0,
            "views_per_day": 2000.0,
            "demand_index": 1.0,
            "problem_rate": 0.015,  # 1.5%
            "videos_per_week_benchmark": 1.0, 
        },
        "Tier_2_Mid": {  # 구독자 10만~50만
            "engagement_per_1k": 22.0,
            "views_per_day": 500.0,
            "demand_index": 0.4,
            "problem_rate": 0.008,  # 0.8%
            "videos_per_week_benchmark": 1.0,
        },
        "Tier_3_Rising": {  # 구독자 1만~10만
            "engagement_per_1k": 18.0,
            "views_per_day": 200.0,
            "demand_index": 0.2,
            "problem_rate": 0.005,  # 0.5%
            "videos_per_week_benchmark": 1.0,
        },
        "Tier_4_Emerging": {  # 구독자 1만 미만
            "engagement_per_1k": 15.0,
            "views_per_day": 50.0,
            "demand_index": 0.1,
            "problem_rate": 0.003,  # 0.3%
            "videos_per_week_benchmark": 1.0,
        }
    }
    
    # Demand 키워드 (구매/사용 인증·긍정 경험)
    DEMAND_KEYWORDS = [
        # 구매 인증
        "구매했어요", "샀어요", "사봤어요", "주문했어요", "결제했어요",
        # 사용 인증  
        "사용해봤어요", "써봤어요", "발라봤어요", "써보니", "사용해보니",
        "쓰고 있어요", "사용 중", "쓰는 중", "사용중",
        # 긍정 경험
        "좋았어요", "좋아요", "만족", "추천", "효과 좋", "괜찮았어요",
        # 행동 인증
        "따라했어요", "따라해봤어요", "해봤어요", "적용했어요",
        "재구매", "또 샀어요", "또 살게요", "리필",
        # 영어
        "bought", "purchased", "tried", "using", "recommend"
    ]
    
    # Problem 키워드 (피부 고민/문제 + 특정 니즈 요청)
    PROBLEM_KEYWORDS = [
        # 피부 트러블
        "여드름", "뾰루지", "트러블", "블랙헤드", "화이트헤드",
        "모공", "각질", "피지", "번들거림",
        # 자극/민감 반응
        "민감", "예민", "따가워", "따갑", "아파", "아파요",
        "자극", "홍조", "붉은기", "빨개", "화끈",
        "가려워", "간지러", "간지럽", "긁어",
        # 피부 상태 문제
        "건조", "당김", "푸석", "각질",
        "유분", "번들", "기름", "번들번들",
        "뒤집어", "올라와", "올라왔",
        # 피부 질환
        "아토피", "건선", "지루성", "습진",
        "피부염", "알레르기",
        # 부작용/문제
        "부작용", "안 맞", "맞지 않", "문제",
        "악화", "심해져", "나빠져",
        # 고민 표현
        "고민", "걱정", "어떡해", "힘들어",
        "스트레스", "콤플렉스",
        # [NEW] 특정 니즈 요청 (민감성/피부타입별 제품 요청)
        "민감성 버전", "민감성 제품", "민감용", "민감 피부용",
        "순한 제품", "순한거", "순하게", "순한 게",
        "건성용", "건성 제품", "건조 피부용",
        "지성용", "지성 제품", "지성 피부용",
        "복합성용", "복합성 제품",
        "없나요", "알려주세요", "추천해주세요", "있나요",
        "버전 없나요", "제품 알려주세요", "용 알려주세요",
        "좀 알려", "알려줘", "추천해줘"
    ]

    def __init__(self, raw_data: dict):
        """지표 계산기 초기화"""
        if not raw_data or 'channel' not in raw_data or 'videos' not in raw_data:
            raise ValueError("입력된 raw_data 형식이 올바르지 않습니다.")
            
        self.data = raw_data
        self.channel_info = self.data['channel']
        self.videos_df = pd.DataFrame(self.data['videos'])
        
        # [NEW] Tier 및 벤치마크 설정
        self.subscriber_count = self.channel_info.get('subscriber_count', 0)
        self.tier = self._get_tier()
        self.benchmark = self.BENCHMARKS[self.tier]
        
        # 댓글 샘플 저장용
        self.demand_comment_samples = []
        self.problem_comment_samples = []
        
        print(f"  [MetricsCalculator] 📊 채널 Tier: {self.tier}")
        print(f"  [MetricsCalculator] 🎯 벤치마크: Engagement {self.benchmark['engagement_per_1k']}, Views/day {self.benchmark['views_per_day']}")
        
        if not self.videos_df.empty:
            self._calculate_basic_metrics()
    
    def _get_tier(self) -> str:
        """[NEW] 구독자 수로 Tier 결정"""
        if self.subscriber_count >= 500_000:
            return "Tier_1_Major"
        elif self.subscriber_count >= 100_000:
            return "Tier_2_Mid"
        elif self.subscriber_count >= 10_000:
            return "Tier_3_Rising"
        else:
            return "Tier_4_Emerging"
    
    def _analyze_comments(self, comments: list) -> dict:
        """댓글 분석: Demand와 Problem (매칭 샘플 포함)"""
        if not comments or not isinstance(comments, list):
            return {
                'demand_count': 0, 
                'problem_count': 0, 
                'total_analyzed_comments': 0,
                'demand_samples': [],
                'problem_samples': []
            }
        
        demand_count = 0
        problem_count = 0
        total_comments = len(comments)
        demand_samples = []  # 매칭된 Demand 댓글 샘플 (최대 3개)
        problem_samples = []  # 매칭된 Problem 댓글 샘플 (최대 3개)
        
        try:
            demand_pattern = re.compile('|'.join(self.DEMAND_KEYWORDS), re.IGNORECASE)
            problem_pattern = re.compile('|'.join(self.PROBLEM_KEYWORDS), re.IGNORECASE)
        except re.error as e:
            print(f"  [MetricsCalculator] ❌ 키워드 정규식 컴파일 오류: {e}")
            return {
                'demand_count': 0, 
                'problem_count': 0, 
                'total_analyzed_comments': total_comments,
                'demand_samples': [],
                'problem_samples': []
            }
        
        for comment_text in comments:
            if not isinstance(comment_text, str):
                continue
            
            # Demand 키워드 매칭
            if demand_pattern.search(comment_text):
                demand_count += 1
                if len(demand_samples) < 3:  # 최대 3개 샘플만 저장
                    # 댓글 길이 제한 (100자)
                    sample = comment_text[:100] + ('...' if len(comment_text) > 100 else '')
                    demand_samples.append(sample)
            
            # Problem 키워드 매칭
            if problem_pattern.search(comment_text):
                problem_count += 1
                if len(problem_samples) < 3:  # 최대 3개 샘플만 저장
                    # 댓글 길이 제한 (100자)
                    sample = comment_text[:100] + ('...' if len(comment_text) > 100 else '')
                    problem_samples.append(sample)
                
        return {
            'demand_count': demand_count,
            'problem_count': problem_count,
            'total_analyzed_comments': total_comments,
            'demand_samples': demand_samples,
            'problem_samples': problem_samples
        }

    def _calculate_basic_metrics(self):
        """기본 지표 계산"""
        if len(self.videos_df) == 0:
            return
        
        df = self.videos_df
        
        df['view_count'] = df['view_count'].replace(0, 1)
        df['views_per_day'] = df['view_count'] / df['days_since_upload']
        df['engagement_per_1k'] = (
            (df['like_count'] + df['comment_count']) 
            / df['view_count'] * 1000
        )
        
        df['likes_per_view'] = df['like_count'] / df['view_count']
        df['comments_per_view'] = df['comment_count'] / df['view_count']
        df['length_bucket'] = df['duration_seconds'].apply(self._classify_length)

        print("  [MetricsCalculator] 💬 댓글 텍스트 키워드 분석 중...")
        
        comment_stats = df['comments'].apply(self._analyze_comments)
        comment_stats_df = comment_stats.apply(pd.Series)
        df = pd.concat([df, comment_stats_df], axis=1)

        # 댓글 수집 통계 출력
        total_comments_collected = df['total_analyzed_comments'].sum()
        total_demand_matches = df['demand_count'].sum()
        total_problem_matches = df['problem_count'].sum()
        avg_comments_per_video = df['total_analyzed_comments'].mean()
        
        print(f"  [MetricsCalculator] 📊 댓글 통계:")
        print(f"     - 전체 수집 댓글: {total_comments_collected:,}개")
        print(f"     - 영상당 평균: {avg_comments_per_video:.1f}개")
        print(f"     - Demand 매칭: {total_demand_matches}개 ({total_demand_matches/total_comments_collected*100:.2f}%)")
        print(f"     - Problem 매칭: {total_problem_matches}개 ({total_problem_matches/total_comments_collected*100:.2f}%)")

        # Demand Index (구매/사용 인증 댓글 / 1,000뷰)
        df['demand_index'] = (df['demand_count'] * 1000) / df['view_count']
        
        # Problem Rate (문제 댓글 / 전체 댓글)
        df['problem_rate'] = df['problem_count'] / (df['total_analyzed_comments'] + 1e-6)
        
        # 매칭 샘플 수집 (전체 영상에서)
        all_demand_samples = []
        all_problem_samples = []
        for idx, row in df.iterrows():
            if 'demand_samples' in row and isinstance(row['demand_samples'], list):
                all_demand_samples.extend(row['demand_samples'])
            if 'problem_samples' in row and isinstance(row['problem_samples'], list):
                all_problem_samples.extend(row['problem_samples'])
        
        # 최대 10개 샘플만 유지 (중복 제거)
        self.demand_comment_samples = list(dict.fromkeys(all_demand_samples))[:10]
        self.problem_comment_samples = list(dict.fromkeys(all_problem_samples))[:10]

        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)
        
        self.videos_df = df
        print(f"  [MetricsCalculator] ✅ {len(self.videos_df)}개 비디오 전처리 완료")
    
    def _classify_length(self, seconds):
        """영상 길이 구간 분류"""
        if seconds < 60: return "0-60초"
        elif seconds < 180: return "60-180초"
        elif seconds < 360: return "3-6분"
        elif seconds < 600: return "6-10분"
        else: return "10분+"
    
    def get_performance_profile(self):
        """조회·참여 프로파일"""
        if self.videos_df.empty:
            return {}
            
        df = self.videos_df
        profile = {}
        
        metrics_to_agg = [
            'views_per_day', 'engagement_per_1k', 
            'likes_per_view', 'comments_per_view',
            'demand_index', 'problem_rate'
        ]
        
        for metric in metrics_to_agg:
            if metric in df.columns:
                profile[f'{metric}_median'] = float(df[metric].median())
                profile[f'{metric}_mean'] = float(df[metric].mean())
                profile[f'{metric}_std'] = float(df[metric].std())
            
        return profile
    
    def analyze_format_effect(self):
        """
        [수정됨 V2.3] 포맷 효과 분석
        - 모든 포맷 키워드를 하나로 합쳐서 계산
        - 상대적 % 개선도 계산 (포맷 없음 대비)
        - 최소 샘플 수 체크
        - 0 나누기 방지
        """
        if self.videos_df.empty:
            return {}
        
        # 모든 포맷 키워드를 하나로 합침
        format_keywords = [
            # Before/After 키워드
            '전후', '전/후', 'before', 'after', '변화', '비포', '애프터',
            # How-to 키워드
            '사용법', '쓰는법', '바르는법', '활용법', '하는법', '방법', '루틴', '꿀팁',
            # Review 키워드
            '리뷰', '후기', '솔직', '사용기', '체험', '추천', '털기', '신상', '또산템', '또 산템', 
            '추천템', '신상템', '내돈내산', '최애', '잘산템', '올리브영', '다이소'
        ]
        
        df = self.videos_df
        
        # 포맷 키워드가 하나라도 포함되어 있으면 True
        if 'has_format' not in df.columns:
            df['has_format'] = df['title'].apply(
                lambda x: any(kw in x.lower() if isinstance(x, str) else False for kw in format_keywords)
            )
        
        # 포맷이 있는 영상과 없는 영상으로 분리
        with_format = df[df['has_format'] == True]
        without_format = df[df['has_format'] == False]
        
        # 최소 샘플 수 체크 (통계적 신뢰성)
        if len(with_format) < 2 or len(without_format) < 2:
            print(f"  [MetricsCalculator] ⚠️ Format: 샘플 부족 (있음:{len(with_format)}, 없음:{len(without_format)})")
            return {}
        
        eng_with = with_format['engagement_per_1k'].median()
        eng_without = without_format['engagement_per_1k'].median()
        
        # 0 나누기 방지 및 개선이 있는 경우만 계산
        if eng_without < 1:
            print(f"  [MetricsCalculator] ⚠️ Format: 기준값 너무 낮음 ({eng_without:.2f})")
            return {}
        
        if eng_with <= eng_without:
            print(f"  [MetricsCalculator] ⚠️ Format: 포맷 효과 없음 (있음:{eng_with:.2f} <= 없음:{eng_without:.2f})")
            return {}
        
        # 상대적 % 개선도 계산
        improvement_pct = ((eng_with - eng_without) / eng_without) * 100
        
        # 극단값 필터링 (200% 초과는 캡)
        if improvement_pct > 200:
            print(f"  [MetricsCalculator] 🔥 Format: 극단값 감지 ({improvement_pct:.1f}% → 200% 캡)")
            improvement_pct = 200
        
        results = {
            'format': {
                'count_with': int(len(with_format)),
                'count_without': int(len(without_format)),
                'engagement_with': float(round(eng_with, 2)),
                'engagement_without': float(round(eng_without, 2)),
                'improvement_pct': float(round(improvement_pct, 2)),
            }
        }
        
        print(f"  [MetricsCalculator] ✅ Format: {improvement_pct:.1f}% 개선 (있음:{eng_with:.1f}, 없음:{eng_without:.1f})")
        
        return results
    
    def analyze_upload_consistency(self, recent_weeks=12):
        """업로드 일관성 분석"""
        if self.videos_df.empty:
            return None
            
        cutoff_days = recent_weeks * 7
        
        if not pd.api.types.is_datetime64_any_dtype(self.videos_df['published_at']):
            self.videos_df['published_at'] = pd.to_datetime(self.videos_df['published_at'])
            
        recent_videos = self.videos_df[self.videos_df['days_since_upload'] <= cutoff_days].copy()
        
        if len(recent_videos) <= 1:
            return {'consistency_score': 0.0, 'videos_per_week': round(len(recent_videos) / recent_weeks, 2)}
        
        recent_videos = recent_videos.sort_values('published_at')
        upload_intervals = recent_videos['published_at'].diff().dt.days.dropna()
        
        if upload_intervals.empty:
             return {'consistency_score': 0.0, 'videos_per_week': round(len(recent_videos) / recent_weeks, 2)}

        return {
            'video_count': int(len(recent_videos)),
            'weeks': int(recent_weeks),
            'videos_per_week': float(round(len(recent_videos) / recent_weeks, 2)),
            'avg_interval_days': float(round(upload_intervals.mean(), 1)),
            'interval_std': float(round(upload_intervals.std(), 1)),
            'consistency_score': float(self._calculate_consistency_score(upload_intervals))
        }
    
    def _calculate_consistency_score(self, intervals):
        """업로드 일관성 점수 (0-100) - 참고용 (V2에서는 videos_per_week 사용)"""
        if intervals.empty: return 0.0
        target_interval = 7
        deviation = abs(intervals - target_interval).mean()
        consistency = max(0, 100 - (deviation / target_interval * 100))
        variability = intervals.std() / target_interval * 100 if intervals.std() > 0 else 0
        consistency = max(0, consistency - variability)
        return round(consistency, 1)
    
    def calculate_blc_score(self):
        """
        [수정됨 V2.4] BLC 점수 계산
        - Engagement Score: 벤치마크의 1.5배를 만점 기준으로 적용 (더 엄격한 평가)
        - Demand Score (15점): 0.5% 이상이면 만점
        - Problem Score (10점): 0.5% 이상이면 만점 (기존 0.2%에서 상향), 벤치마크 2배를 만점 기준
        - Format Fit Score (10점): 상대적 % 방식, 50% 개선 = 100점 기준 (2배 스케일링)
        """
        if self.videos_df.empty:
            return {'blc_score': 0.0, 'verdict': 'N/A', 'components': {}, 'tier': self.tier}

        # 1. Engagement Score (30%)
        # [수정됨 V2.4] 더 엄격한 기준 적용: 벤치마크의 1.5배를 만점 기준으로 설정
        eng_median = self.videos_df['engagement_per_1k'].median()
        engagement_benchmark_adjusted = self.benchmark['engagement_per_1k'] * 1.5  # 벤치마크 1.5배를 만점 기준
        eng_score = min((eng_median / engagement_benchmark_adjusted) * 100, 100)
        
        # 2. Views Score (25%)
        vpd_median = self.videos_df['views_per_day'].median()
        views_score = min((vpd_median / self.benchmark['views_per_day']) * 100, 100)
        
        # 3. Demand Score (15%)
        # Demand Index = 댓글 중 구매/사용 인증 댓글 수 / 1,000뷰
        demand_index_median = self.videos_df['demand_index'].median()
        
        # 만점 기준: 0.5% 이상이면 만점 (Demand per 1K views = 5.0 이상)
        # 0.5% = 0.005 = 5.0 per 1K views
        DEMAND_MAX_THRESHOLD = 5.0  # 0.5% = 5.0 per 1K views
        
        if demand_index_median >= DEMAND_MAX_THRESHOLD:
            demand_score = 100.0
        else:
            # 벤치마크 대비 상대 평가
            demand_score = min((demand_index_median / self.benchmark['demand_index']) * 100, 100)
        
        # 4. Problem Score (Needs Score, 10%)
        # Problem Rate = 댓글 중 특정 니즈 요청 댓글 비율
        problem_rate_median = self.videos_df['problem_rate'].median()
        benchmark_problem_rate = self.benchmark['problem_rate']
        
        # [수정됨 V2.4] 더 엄격한 기준 적용: 만점 기준을 0.5% (0.005)로 상향 조정
        PROBLEM_MAX_THRESHOLD = 0.005  # 0.5% = 0.005 (기존 0.2%에서 상향)
        
        if problem_rate_median >= PROBLEM_MAX_THRESHOLD:
            problem_score = 100.0
        elif benchmark_problem_rate > 0:
            # 벤치마크 대비 상대 평가 (더 엄격하게: 벤치마크의 2배를 만점 기준으로 간주)
            problem_rate_benchmark_adjusted = benchmark_problem_rate * 2.0  # 벤치마크 2배를 만점 기준
            problem_score = (problem_rate_median / problem_rate_benchmark_adjusted) * 100
        else:
            problem_score = 0
            
        problem_score = min(problem_score, 100)
        
        # 5. Format Fit Score (10%) - [수정됨 V2.3: 통합 포맷 계산]
        format_effects = self.analyze_format_effect()
        
        if format_effects and 'format' in format_effects:
            format_data = format_effects['format']
            improvement_pct = format_data['improvement_pct']
            
            # 50% 개선 = 100점 (2배 스케일링)
            format_score = min(improvement_pct * 2, 100)
        else:
            format_score = 50  # 기본값 (포맷 효과 분석 불가)
            print(f"  [MetricsCalculator] ⚠️ Format Score: 50점 (기본값) - 포맷 효과 분석 불가")
        
        format_score = min(format_score, 100)
        
        # 6. Consistency Score (10%)
        consistency = self.analyze_upload_consistency()
        videos_per_week = consistency['videos_per_week'] if consistency else 0
        benchmark_vpw = self.benchmark.get('videos_per_week_benchmark', 1.0)
        
        if benchmark_vpw > 0:
            consistency_score = (videos_per_week / benchmark_vpw) * 100
        else:
            consistency_score = 0

        consistency_score = min(consistency_score, 100)
        
        # 최종 BLC 점수 (가중 평균)
        blc = (
            eng_score * 0.30 +
            views_score * 0.25 +
            demand_score * 0.15 +
            problem_score * 0.10 +
            format_score * 0.10 +
            consistency_score * 0.10
        )
        
        # 100점 cap
        blc = min(blc, 100)
        
        # 판정 (5단계)
        if blc >= 80:
            verdict = "S (즉시 Go)"
        elif blc >= 65:
            verdict = "A (Go)"
        elif blc >= 50:
            verdict = "B (조건부 Go)"
        elif blc >= 35:
            verdict = "C (보류)"
        else:
            verdict = "D (부적합)"
        return {
            'blc_score': float(round(blc, 1)),
            'verdict': verdict,
            'tier': self.tier,
            'components': {
                'engagement_score': float(round(eng_score, 1)),
                'views_score': float(round(views_score, 1)),
                'demand_score': float(round(demand_score, 1)),
                'problem_score': float(round(problem_score, 1)),
                'format_score': float(round(format_score, 1)),
                'consistency_score': float(round(consistency_score, 1))
            },
            'raw_values': {
                'engagement_median': float(round(eng_median, 2)),
                'views_per_day_median': float(round(vpd_median, 1)),
                'demand_index_median': float(round(demand_index_median, 2)),
                'problem_rate_median': float(round(problem_rate_median, 4)),
                'videos_per_week': videos_per_week
            }
        }
    
    def get_blc_matching(self, blc_components: dict, format_effects: dict) -> dict:
        """
        [수정됨] BLC 기반 알고리즘 매칭 (Tier 고려)
        """
        demand = blc_components.get('demand_score', 0)
        problem = blc_components.get('problem_score', 0)
        engagement = blc_components.get('engagement_score', 0)
        
        # 알고리즘 기반 매칭
        category = ""
        image = ""
        skincare = ""
        product_type = ""
        
        # 고성과 채널 (Engagement 80+)
        if engagement >= 80:
            if demand >= 80:
                category = "프리미엄·전문가 카테고리"
                image = "신뢰·권위·전문가형"
                skincare = "고기능성 세럼/앰플/크림"
                product_type = "프리미엄 집중케어 라인"
            else:
                category = "트렌드·큐레이터 카테고리"
                image = "트렌디·혁신·인플루언서형"
                skincare = "신제품/한정판/컬러"
                product_type = "시즌 트렌드 라인"
        
        # 중상위 채널 (Engagement 60-80)
        elif engagement >= 60:
            if demand >= 60 and problem < 60:
                category = "데일리·입문자 카테고리"
                image = "실용·안심·친절한 가이드형"
                skincare = "토너/로션/클렌징/저자극"
                product_type = "베이직 루틴 세트"
            elif demand >= 60 and problem >= 60:
                category = "피부타입별·솔루션 카테고리"
                image = "전문가 코치·카운슬링형"
                skincare = "피부타입별 라인(건성/지성/민감)"
                product_type = "맞춤형 솔루션 라인"
            else:
                category = "일반 스킨케어 카테고리"
                image = "신뢰·균형·안정형"
                skincare = "올인원/에센스/크림"
                product_type = "데일리 기능성 제품"
        
        # 중위권 채널 (Engagement 40-60)
        elif engagement >= 40:
            if problem >= 70:
                category = "기능성·집중케어 카테고리"
                image = "문제해결·전문가형"
                skincare = "앰플/세럼/고농축 라인"
                product_type = "집중 케어 솔루션"
            else:
                category = "일반 스킨케어 카테고리"
                image = "친근·실용형"
                skincare = "로션/크림/마스크팩"
                product_type = "데일리 케어 제품"
        
        # 하위권 채널
        else:
            category = "성장 필요 카테고리"
            image = "성장 단계·잠재력 모니터링"
            skincare = "기초 제품 협업 가능"
            product_type = "샘플/체험 키트"
        
        return {
            'category': category,
            'image': image,
            'skincare': skincare,
            'product_type': product_type
        }
    
    def generate_summary_report(self):
        """한 장 요약 보고서 생성"""
        if self.videos_df.empty:
            print("  [MetricsCalculator] ⚠️ 분석할 비디오가 없습니다.")
            return {
                'channel_name': self.channel_info['channel_name'],
                'subscriber_count': f"{self.channel_info.get('subscriber_count', 0):,}",
                'total_views': f"{self.channel_info.get('total_views', 0):,}",
                'video_count_analyzed': 0,
                'blc_score': 0, 'verdict': 'N/A', 'tier': self.tier,
                'performance_profile': {}, 'format_effects': {},
                'upload_consistency': {}, 'blc_breakdown': {},
                'blc_matching': {}
            }
            
        # 모든 지표 계산
        performance = self.get_performance_profile()
        format_effects = self.analyze_format_effect()
        consistency = self.analyze_upload_consistency()
        blc = self.calculate_blc_score()
        
        # BLC 매칭 알고리즘 실행
        blc_matching = self.get_blc_matching(blc['components'], format_effects)
        
        # 댓글 통계 계산
        total_comments_collected = int(self.videos_df['total_analyzed_comments'].sum())
        total_demand_matches = int(self.videos_df['demand_count'].sum())
        total_problem_matches = int(self.videos_df['problem_count'].sum())
        avg_comments_per_video = float(self.videos_df['total_analyzed_comments'].mean())
        
        report = {
            'channel_name': self.channel_info['channel_name'],
            'subscriber_count': f"{self.channel_info.get('subscriber_count', 0):,}",
            'total_views': f"{self.channel_info.get('total_views', 0):,}",
            'video_count_analyzed': int(len(self.videos_df)),
            'blc_score': blc['blc_score'],
            'verdict': blc['verdict'],
            'tier': blc['tier'],
            'performance_profile': performance,
            'format_effects': format_effects,
            'upload_consistency': consistency,
            'blc_breakdown': blc['components'],
            'raw_values': blc['raw_values'],
            'blc_matching': blc_matching,
            'comment_statistics': {
                'total_comments_collected': total_comments_collected,
                'avg_comments_per_video': round(avg_comments_per_video, 1),
                'total_demand_matches': total_demand_matches,
                'total_problem_matches': total_problem_matches,
                'demand_match_rate': round(total_demand_matches / total_comments_collected * 100, 2) if total_comments_collected > 0 else 0,
                'problem_match_rate': round(total_problem_matches / total_comments_collected * 100, 2) if total_comments_collected > 0 else 0
            },
            'comment_samples': {
                'demand_samples': self.demand_comment_samples[:10],  # 최대 10개
                'problem_samples': self.problem_comment_samples[:10]  # 최대 10개
            }
        }
        
        return report
