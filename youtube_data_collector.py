"""
YouTube Creator Analysis System - 데이터 수집 모듈 (수정본)
- 각 영상의 댓글 텍스트 수집 기능 추가
- @username으로 채널 ID 검색 기능 포함
"""

import os
import json
from datetime import datetime, timedelta
from googleapiclient.discovery import build # pip install google-api-python-client
from googleapiclient.errors import HttpError
import isodate # pip install isodate

class YouTubeDataCollector:
    def __init__(self, api_key):
        """
        YouTube Data API 클라이언트 초기화
        """
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
    
    def get_channel_id_from_username(self, username):
        """
        채널 사용자명(@username)으로 채널 ID 찾기
        """
        try:
            # @ 제거
            username_cleaned = username.replace('@', '')
            
            # 1. handles().list API 사용 (최신 방식)
            # 이 API는 핸들로 직접 ID를 가져옵니다.
            request = self.youtube.channels().list(
                part='id',
                forHandle=username_cleaned
            )
            response = request.execute()
            if 'items' in response and response['items']:
                return response['items'][0]['id']

            # 2. forUsername 사용 (구형 방식)
            request = self.youtube.channels().list(
                part='id',
                forUsername=username_cleaned
            )
            response = request.execute()
            
            if 'items' in response and response['items']:
                return response['items'][0]['id']
            
            # 3. search API 사용 (최후의 수단)
            request = self.youtube.search().list(
                part='id',
                q=username, # @가 포함된 원래 이름으로 검색
                type='channel',
                maxResults=1
            )
            response = request.execute()
            
            if 'items' in response and response['items']:
                return response['items'][0]['id']['channelId']
            
            return None
            
        except HttpError as e:
            print(f"  [DataCollector] ❌ 채널 검색 오류: {e}")
            return None
    
    def get_channel_info(self, channel_id):
        """
        채널 기본 정보 수집
        """
        try:
            request = self.youtube.channels().list(
                part='snippet,statistics',
                id=channel_id
            )
            response = request.execute()
            
            if 'items' not in response or not response['items']:
                print(f"  [DataCollector] ❌ 채널을 찾을 수 없습니다: {channel_id}")
                return None
            
            channel = response['items'][0]
            
            return {
                'channel_id': channel_id,
                'channel_name': channel['snippet']['title'],
                'description': channel['snippet']['description'],
                'subscriber_count': int(channel['statistics'].get('subscriberCount', 0)),
                'total_views': int(channel['statistics']['viewCount']),
                'video_count': int(channel['statistics']['videoCount']),
                'published_at': channel['snippet']['publishedAt']
            }
            
        except HttpError as e:
            print(f"  [DataCollector] ❌ HTTP 오류: {e}")
            return None
        except Exception as e:
            print(f"  [DataCollector] ❌ 예상치 못한 오류: {e}")
            return None
    
    def get_channel_videos(self, channel_id, max_results=50, months_back=6):
        """
        채널의 최근 영상 목록 수집
        """
        try:
            # 분석 시작 날짜 계산
            published_after = (datetime.now() - timedelta(days=months_back*30)).isoformat() + 'Z'
            
            video_ids = []
            next_page_token = None
            
            while len(video_ids) < max_results:
                request = self.youtube.search().list(
                    part='id',
                    channelId=channel_id,
                    type='video',
                    order='date', # 최신순
                    maxResults=min(50, max_results - len(video_ids)), # API 최대 50개
                    publishedAfter=published_after,
                    pageToken=next_page_token
                )
                response = request.execute()
                
                video_ids.extend([item['id']['videoId'] for item in response['items']])
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break # 다음 페이지 없으면 종료
            
            return video_ids
            
        except HttpError as e:
            print(f"  [DataCollector] ❌ API 오류: {e}")
            return []
            
    def _get_comment_threads(self, video_id: str, max_comments: int = 100) -> list:
        """[NEW] 영상의 최상위 댓글 텍스트 목록을 수집합니다."""
        comments = []
        try:
            request = self.youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(max_comments, 100), # API 최대 100
                order="relevance", # 관련성 높은 댓글 (또는 'time' for 최신)
                textFormat="plainText"
            )
            response = request.execute()
            
            for item in response.get('items', []):
                comment_text = item['snippet']['topLevelComment']['snippet']['textDisplay']
                comments.append(comment_text)
                
            return comments
        except HttpError as e:
            # 403: 댓글 비활성화 또는 접근 거부
            if e.resp.status == 403:
                print(f"    [DataCollector] ⚠️ {video_id} 영상 댓글 비활성화됨.")
            else:
                print(f"    [DataCollector] ❌ {video_id} 댓글 수집 중 오류: {e}")
            return [] # 오류 발생 시 빈 리스트 반환
        except Exception as e:
            print(f"    [DataCollector] ❌ {video_id} 댓글 파싱 중 알 수 없는 오류: {e}")
            return []

    def get_video_details(self, video_ids, include_comments=True, max_comments=100):
        """
        [수정됨] 영상 상세 정보 + 댓글 텍스트 수집 (배치 처리)
        """
        videos_data = []
        
        # API는 한 번에 최대 50개까지 ID 처리 가능
        for i in range(0, len(video_ids), 50):
            batch_ids = video_ids[i:i+50]
            
            try:
                # 1. 비디오 기본 정보/통계 일괄 조회
                request = self.youtube.videos().list(
                    part='snippet,contentDetails,statistics',
                    id=','.join(batch_ids)
                )
                response = request.execute()
                
                for video in response['items']:
                    # 영상 길이(ISO 8601)를 초 단위로 변환
                    duration_iso = video['contentDetails']['duration']
                    duration_seconds = int(isodate.parse_duration(duration_iso).total_seconds())
                    
                    # 업로드 날짜로부터 경과 일수 계산
                    published_at_str = video['snippet']['publishedAt']
                    published_at = datetime.fromisoformat(published_at_str.replace('Z', '+00:00'))
                    days_since_upload = (datetime.now(published_at.tzinfo) - published_at).days
                    if days_since_upload == 0:
                        days_since_upload = 1  # 0으로 나누기 방지
                    
                    video_data = {
                        'video_id': video['id'],
                        'title': video['snippet']['title'],
                        'published_at': published_at_str,
                        'days_since_upload': days_since_upload,
                        'duration_seconds': duration_seconds,
                        'duration_formatted': self._format_duration(duration_seconds),
                        'view_count': int(video['statistics'].get('viewCount', 0)),
                        'like_count': int(video['statistics'].get('likeCount', 0)),
                        'comment_count': int(video['statistics'].get('commentCount', 0)),
                        'tags': video['snippet'].get('tags', []),
                        'thumbnail_high': video['snippet']['thumbnails'].get('high', {}).get('url', ''),
                        'comments': [] # [NEW] 댓글 필드 초기화
                    }
                    
                    # 2. [NEW] 개별 영상의 댓글 수집 로직 추가
                    if include_comments:
                        # 이 부분은 영상 N개만큼 API를 추가 호출합니다.
                        comments_collected = self._get_comment_threads(
                            video['id'], 
                            max_comments=max_comments
                        )
                        video_data['comments'] = comments_collected
                        if len(comments_collected) > 0:
                            print(f"    [DataCollector] 💬 {video['id']} 댓글 {len(comments_collected)}개 수집 완료")
                        else:
                            print(f"    [DataCollector] 💬 {video['id']} 댓글 수집 실패 또는 댓글 없음")
                    
                    videos_data.append(video_data)
                    
            except HttpError as e:
                print(f"  [DataCollector] ❌ API 오류 (Video Batch {i}): {e}")
                continue
        
        return videos_data
    
    def _format_duration(self, seconds):
        """영상 길이를 읽기 쉬운 형식으로 변환"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"
    
    def collect_full_data(self, channel_id, max_videos=50, months_back=6):
        """
        [수정됨] 채널의 전체 데이터 수집 (원스톱, 댓글 포함)
        """
        print(f"  [DataCollector] 📊 채널 정보 수집 중...")
        channel_info = self.get_channel_info(channel_id)
        
        if not channel_info:
            print("  [DataCollector] ❌ 채널을 찾을 수 없습니다.")
            return None
        
        print(f"  [DataCollector] ✅ 채널: {channel_info['channel_name']}")
        print(f"     구독자: {channel_info['subscriber_count']:,}명")
        print(f"     총 조회수: {channel_info['total_views']:,}회")
        
        print(f"\n  [DataCollector] 🎬 최근 {months_back}개월 영상 ID 수집 중...")
        video_ids = self.get_channel_videos(channel_id, max_videos, months_back)
        print(f"  [DataCollector] ✅ 영상 {len(video_ids)}개 발견 (최대 {max_videos}개)")
        
        if not video_ids:
            print("  [DataCollector] ⚠️ 분석할 영상이 없습니다.")
            return {
                'channel': channel_info,
                'videos': [],
                'collection_date': datetime.now().isoformat(),
                'analysis_period_months': months_back
            }

        print(f"\n  [DataCollector] 📝 영상 상세 정보 및 댓글 수집 중... (시간 소요)")
        videos_data = self.get_video_details(video_ids, include_comments=True, max_comments=100)
        
        # 댓글 수집 통계
        total_comments = sum(len(video.get('comments', [])) for video in videos_data)
        videos_with_comments = sum(1 for video in videos_data if len(video.get('comments', [])) > 0)
        avg_comments = total_comments / len(videos_data) if len(videos_data) > 0 else 0
        
        print(f"  [DataCollector] ✅ {len(videos_data)}개 영상 정보 및 댓글 수집 완료")
        print(f"  [DataCollector] 📊 댓글 수집 통계:")
        print(f"     - 전체 수집 댓글: {total_comments:,}개")
        print(f"     - 댓글 수집된 영상: {videos_with_comments}/{len(videos_data)}개 ({videos_with_comments/len(videos_data)*100:.1f}%)")
        print(f"     - 영상당 평균 댓글: {avg_comments:.1f}개")
        
        return {
            'channel': channel_info,
            'videos': videos_data,
            'collection_date': datetime.now().isoformat(),
            'analysis_period_months': months_back
        }
    
    def save_to_json(self, data, filename='channel_data.json'):
        """수집한 데이터를 JSON 파일로 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n  [DataCollector] 💾 데이터 저장 완료: {filename}")


# ========================================
# 사용 예시 (이 파일을 직접 실행할 경우)
# ========================================
if __name__ == "__main__":
    # API 키 설정 (실제 키로 변경 필요)
    API_KEY = "YOUR_YOUTUBE_API_KEY" # .env 또는 직접 입력
    
    if API_KEY == "YOUR_YOUTUBE_API_KEY":
        print("❌ 'youtube_data_collector.py' 하단의 API_KEY를 설정해야 합니다.")
    else:
        collector = YouTubeDataCollector(API_KEY)
        
        # @username 또는 채널 ID
        channel_query = "@bbomni" 
        
        print(f"🔍 채널 ID 검색 중: {channel_query}")
        CHANNEL_ID = channel_query
        
        # UC로 시작하지 않으면 ID 검색 시도
        if not channel_query.startswith("UC"):
            CHANNEL_ID = collector.get_channel_id_from_username(channel_query)
        
        if not CHANNEL_ID:
            print("❌ 채널을 찾을 수 없습니다.")
        else:
            print(f"✅ 채널 ID 발견: {CHANNEL_ID}\n")
            
            data = collector.collect_full_data(
                channel_id=CHANNEL_ID,
                max_videos=50,  # 테스트용 (최대 50개)
                months_back=6   # 최근 6개월
            )
            
            if data:
                filename = f"data_{CHANNEL_ID}_{datetime.now().strftime('%Y%m%d')}.json"
                collector.save_to_json(data, filename)
                print(f"\n✅ 분석 준비 완료!")
                print(f"   수집된 영상: {len(data['videos'])}개")
                print(f"   다음 단계: 지표 계산 모듈 실행 (`{filename}` 파일 사용)")